import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { prepareQptImport, WorkbookValidationError } from './prepare-import'

async function canonicalBytes() {
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Instructions').addRow(['QPT Template v1'])
  workbook.addWorksheet('Assessment').addRows([
    ['field', 'value'],
    ['template_version', '1'],
    ['assessment_code', 'QPT-2026-06'],
    ['academic_year', '2026-27'],
    ['qpt_number', 6],
    ['batch_code', '10-E'],
    ['test_date', '2026-07-13'],
    ['display_title', 'QPT 06'],
    ['ranking_basis', 'TOTAL_SCORE'],
  ])
  workbook.addWorksheet('Scores').addRows([
    [
      'roll_no',
      'student_name_for_review',
      'subject_code',
      'max_marks',
      'score',
      'status',
      'source_rank',
    ],
    ['TEST-001', 'Test Student 001', 'MATHS', 100, -1, 'PRESENT', 2],
  ])
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}

async function legacyBytes() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')
  sheet.addRow(['QPT-2 Science Batch TEST-A (26-06-2026)'])
  sheet.addRow(['Result'])
  sheet.addRow([
    'Roll No.',
    'Batch',
    'Student Name',
    'Science (80)',
    'G.Total (80)',
    '%age',
    'Rank',
  ])
  sheet.addRow(['TEST-001', 'TEST-A', 'Test Student 001', 72, 72, 90, 1])
  workbook.addWorksheet('paper-I').addRow([
    'Student Phone',
    'Father Phone',
    'Mother Phone',
  ])
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}

describe('prepareQptImport', () => {
  it('normalizes a canonical workbook into the server staging contract', async () => {
    const prepared = await prepareQptImport(await canonicalBytes(), {
      sourceFilename: 'canonical-qpt.xlsx',
    })

    expect(prepared.format).toBe('canonical')
    expect(prepared.reviewState).toBe('READY_FOR_REVIEW')
    expect(prepared.stagePayload.assessment).toMatchObject({
      parser_version: 'canonical-v1',
      assessment_code: 'QPT-2026-06',
      ranking_basis: 'assessment_total',
    })
    expect(prepared.stagePayload.rows).toEqual([
      expect.objectContaining({
        roll_no: 'TEST-001',
        subject_code: 'MATHS',
        score: '-1',
        status: 'present',
      }),
    ])
    expect(prepared.safeSummary).toEqual({
      studentCount: 1,
      scoreRowCount: 1,
      subjectCount: 1,
      negativeScoreCount: 1,
      absentCount: 0,
    })
    expect(prepared.rawSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(prepared.normalizedSha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('quarantines legacy filename metadata mismatches while retaining a review payload', async () => {
    const prepared = await prepareQptImport(await legacyBytes(), {
      sourceFilename: 'QPT-2 Science TEST-B result.xlsx',
    })

    expect(prepared.format).toBe('legacy-sheet1')
    expect(prepared.reviewState).toBe('QUARANTINED')
    expect(prepared.blockingIssues.map((entry) => entry.code)).toContain(
      'filename_batch_mismatch',
    )
    expect(prepared.stagePayload.assessment.ranking_basis).toBe('source_rank')
  })

  it('rejects an unknown workbook layout', async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.addWorksheet('Unknown').addRow(['not a result'])
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer())

    await expect(
      prepareQptImport(bytes, { sourceFilename: 'unknown.xlsx' }),
    ).rejects.toBeInstanceOf(WorkbookValidationError)
    await expect(
      prepareQptImport(bytes, { sourceFilename: 'unknown.xlsx' }),
    ).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'unknown_workbook_layout' })],
    })
  })
})

const privateFixtureDirectory = process.env.QPT_PRIVATE_FIXTURES_DIR
const runPrivateFixtures =
  process.env.RUN_PRIVATE_FIXTURES === '1' && privateFixtureDirectory

describe.runIf(Boolean(runPrivateFixtures))('private real import pipeline', () => {
  const cases = [
    ['QPT-1 Botany O-1 result.xlsx', 12, 1, 0, false],
    ['QPT-1 Chemistry E-0 result.xlsx', 41, 1, 0, true],
    ['QPT-2 Science Maths 9th-E result.xlsx', 10, 2, 0, true],
    ['QPT-3 English 10th-M.xlsx', 37, 1, 0, false],
    ['QPT-4 Science 7th result.xlsx', 5, 1, 0, false],
    ['QPT-6 Maths F-1 result.xlsx', 76, 1, 4, false],
  ] as const

  it.each(cases)(
    'prepares %s with only safe aggregate assertions',
    async (filename, scoreRows, subjects, negativeScores, quarantined) => {
      const bytes = await readFile(path.join(privateFixtureDirectory!, filename))
      const prepared = await prepareQptImport(bytes, { sourceFilename: filename })

      expect({
        scoreRows: prepared.safeSummary.scoreRowCount,
        subjects: prepared.safeSummary.subjectCount,
        negativeScores: prepared.safeSummary.negativeScoreCount,
        quarantined: prepared.reviewState === 'QUARANTINED',
        rawDigestValid: /^[0-9a-f]{64}$/.test(prepared.rawSha256),
        normalizedDigestValid: /^[0-9a-f]{64}$/.test(
          prepared.normalizedSha256,
        ),
      }).toEqual({
        scoreRows,
        subjects,
        negativeScores,
        quarantined,
        rawDigestValid: true,
        normalizedDigestValid: true,
      })
    },
  )
})
