import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  parseLegacyQptWorkbook,
  WorkbookValidationError,
} from './parse-legacy-workbook'

type LegacyStudent = {
  rollNo: string
  batch: string
  name: string
  scores: number[]
  rank: number
}

async function legacyWorkbook(options?: {
  title?: string
  subjects?: Array<{ name: string; maxMarks: number }>
  students?: LegacyStudent[]
  mutate?: (workbook: ExcelJS.Workbook) => void
}) {
  const subjects = options?.subjects ?? [{ name: 'Science', maxMarks: 40 }]
  const students = options?.students ?? [
    {
      rollNo: 'TEST-001',
      batch: 'TEST-A',
      name: 'Test Student 001',
      scores: [34],
      rank: 1,
    },
  ]
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')
  const totalMax = subjects.reduce((total, subject) => total + subject.maxMarks, 0)
  sheet.mergeCells(1, 1, 1, subjects.length + 6)
  sheet.getCell('A1').value =
    options?.title ?? 'Obj. QPT-4 Science Batch TEST-A (30-06-2026)'
  sheet.addRow([])
  sheet.addRow([
    'Roll No.',
    'Batch',
    'Student Name',
    ...subjects.map((subject) => `${subject.name} (${subject.maxMarks})`),
    `G.Total (${totalMax})`,
    '%age',
    'Rank',
  ])
  for (const student of students) {
    const total = student.scores.reduce((sum, score) => sum + score, 0)
    const row = sheet.addRow([
      student.rollNo,
      student.batch,
      student.name,
      ...student.scores,
      null,
      null,
      null,
    ])
    const totalColumn = 4 + subjects.length
    row.getCell(totalColumn).value = { formula: 'SUM(D4:D4)', result: total }
    row.getCell(totalColumn + 1).value = {
      formula: `${row.getCell(totalColumn).address}/${totalMax}*100`,
      result: (total / totalMax) * 100,
    }
    row.getCell(totalColumn + 2).value = {
      formula: `RANK(${row.getCell(totalColumn).address},$${row.getCell(totalColumn).address}:$${row.getCell(totalColumn).address})`,
      result: student.rank,
    }
  }

  const raw = workbook.addWorksheet('paper-I')
  raw.addRow([
    'Roll No.',
    'Student Name',
    'Total',
    'Student Phone',
    'Father Phone',
    'Mother Phone',
  ])
  raw.addRow([
    'TEST-001',
    'Test Student 001',
    39,
    'REDACTED',
    'REDACTED',
    'REDACTED',
  ])
  workbook.addWorksheet('Sheet2').addRow(['Synthetic answer key'])

  options?.mutate?.(workbook)
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}

describe('parseLegacyQptWorkbook', () => {
  it('projects only cached Sheet1 results and never returns other-tab values', async () => {
    const bytes = await legacyWorkbook()

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
    })

    expect(parsed.assessment).toMatchObject({
      qptNumber: 4,
      batchCode: 'TEST-A',
      testDate: '2026-06-30',
    })
    expect(parsed.subjects).toEqual([
      { sourceColumn: 4, name: 'Science', code: 'SCIENCE', maxMarks: '40' },
    ])
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]).toMatchObject({
      rollNo: 'TEST-001',
      subjectCode: 'SCIENCE',
      score: '34',
      maxMarks: '40',
      sourceRank: 1,
    })
    expect(JSON.stringify(parsed)).not.toContain('Phone')
    expect(JSON.stringify(parsed)).not.toContain('REDACTED')
    expect(parsed.reviewState).toBe('READY_FOR_REVIEW')
  })

  it('normalizes a multi-subject Sheet1 into one row per student and subject', async () => {
    const bytes = await legacyWorkbook({
      title: 'QPT-2 Science, Maths Batch 9th-M (26-06-2026)',
      subjects: [
        { name: 'Maths', maxMarks: 60 },
        { name: 'Science', maxMarks: 80 },
      ],
      students: [
        {
          rollNo: 'TEST-009',
          batch: '9th-M',
          name: 'Test Student 009',
          scores: [51, 72],
          rank: 1,
        },
      ],
    })

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-2 Science Maths 9th-M result.xlsx',
    })

    expect(parsed.subjects.map((subject) => subject.code)).toEqual([
      'MATHS',
      'SCIENCE',
    ])
    expect(parsed.rows.map((row) => row.score)).toEqual(['51', '72'])
    expect(parsed.assessment.assessmentCode).toBe(
      'QPT-2-2026-06-26-9TH-M-MATHS-SCIENCE',
    )
  })

  it('quarantines filename, title, and row-batch mismatches', async () => {
    const bytes = await legacyWorkbook()

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-4 Science TEST-B result.xlsx',
    })

    expect(parsed.reviewState).toBe('QUARANTINED')
    expect(parsed.blockingIssues.map((entry) => entry.code)).toContain(
      'filename_batch_mismatch',
    )
  })

  it('accepts a distinct normalized title-batch segment before noisy subject inference', async () => {
    const bytes = await legacyWorkbook()

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-4 General Science TEST-A result.xlsx',
    })

    expect(parsed.reviewState).toBe('READY_FOR_REVIEW')
    expect(parsed.blockingIssues.map((entry) => entry.code)).not.toContain(
      'filename_batch_mismatch',
    )
  })

  it('accepts the title batch when a terminal result marker is glued to its segment', async () => {
    const bytes = await legacyWorkbook()

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-4 General Science TEST-Aresult.xlsx',
    })

    expect(parsed.reviewState).toBe('READY_FOR_REVIEW')
    expect(parsed.blockingIssues.map((entry) => entry.code)).not.toContain(
      'filename_batch_mismatch',
    )
  })

  it('does not treat a title batch embedded inside a larger filename segment as a match', async () => {
    const bytes = await legacyWorkbook()

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-4 Science TEST-A2 result.xlsx',
    })

    expect(parsed.reviewState).toBe('QUARANTINED')
    expect(parsed.blockingIssues.map((entry) => entry.code)).toContain(
      'filename_batch_mismatch',
    )
  })

  it('preserves independent filename-QPT and row-batch blockers', async () => {
    const bytes = await legacyWorkbook({
      students: [
        {
          rollNo: 'TEST-001',
          batch: 'TEST-B',
          name: 'Test Student 001',
          scores: [34],
          rank: 1,
        },
      ],
    })

    const parsed = await parseLegacyQptWorkbook(bytes, {
      sourceFilename: 'QPT-5 General Science TEST-A result.xlsx',
    })

    expect(parsed.reviewState).toBe('QUARANTINED')
    expect(parsed.blockingIssues.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(['filename_qpt_mismatch', 'row_batch_mismatch']),
    )
  })

  it('rejects formula results that were not cached by the source workbook', async () => {
    const bytes = await legacyWorkbook({
      mutate: (workbook) => {
        workbook.getWorksheet('Sheet1')!.getCell('D4').value = {
          formula: '1+1',
        }
      },
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toBeInstanceOf(WorkbookValidationError)
    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'formula_result_missing' })],
    })
  })

  it('rejects cached spreadsheet errors instead of treating them as absence', async () => {
    const bytes = await legacyWorkbook({
      mutate: (workbook) => {
        workbook.getWorksheet('Sheet1')!.getCell('D4').value = {
          formula: 'NA()',
          result: { error: '#N/A' },
        }
      },
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'formula_result_invalid' })],
    })
  })

  it.each(['A1048576', 'XFD4'])(
    'rejects a sparse legacy Sheet1 cell at %s before row iteration',
    async (address) => {
      const bytes = await legacyWorkbook({
        mutate: (workbook) => {
          workbook.getWorksheet('Sheet1')!.getCell(address).value = 'sparse'
        },
      })

      await expect(
        parseLegacyQptWorkbook(bytes, {
          sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
        }),
      ).rejects.toMatchObject({
        issues: [
          expect.objectContaining({ code: 'worksheet_dimension_exceeded' }),
        ],
      })
    },
  )

  it('rejects a legacy score that cannot fit numeric(12,4)', async () => {
    const bytes = await legacyWorkbook({
      mutate: (workbook) => {
        workbook.getWorksheet('Sheet1')!.getCell('D4').value = '100000000'
      },
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'numeric_out_of_range' })],
    })
  })

  it('rejects a legacy QPT number outside the PostgreSQL integer range', async () => {
    const bytes = await legacyWorkbook({
      title: 'QPT-2147483648 Science Batch TEST-A (30-06-2026)',
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-2147483648 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'invalid_display_title' }),
      ]),
    })
  })

  it('rejects a displayed rank outside the PostgreSQL integer range', async () => {
    const bytes = await legacyWorkbook({
      mutate: (workbook) => {
        workbook.getWorksheet('Sheet1')!.getCell('G4').value = {
          formula: '1',
          result: 2_147_483_648,
        }
      },
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'invalid_rank' }),
      ]),
    })
  })

  it('rejects Sheet1 when populated cells exceed the legacy parser budget', async () => {
    const bytes = await legacyWorkbook({
      mutate: (workbook) => {
        const sheet = workbook.getWorksheet('Sheet1')!
        for (let row = 5; row <= 3_130; row += 1) {
          for (let column = 1; column <= 64; column += 1) {
            sheet.getCell(row, column).value = `${row}-${column}`
          }
        }
      },
    })

    await expect(
      parseLegacyQptWorkbook(bytes, {
        sourceFilename: 'QPT-4 Science TEST-A result.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'workbook_cell_limit_exceeded' }),
      ]),
    })
  })
})

const privateFixtureDirectory = process.env.QPT_PRIVATE_FIXTURES_DIR
const runPrivateFixtures =
  process.env.RUN_PRIVATE_FIXTURES === '1' && privateFixtureDirectory

describe.runIf(Boolean(runPrivateFixtures))('private real workbook compatibility', () => {
  const cases = [
    ['QPT-1 Botany O-1 result.xlsx', 12, 1, 0, false],
    ['QPT-1 Chemistry E-0 result.xlsx', 41, 1, 0, true],
    ['QPT-2 Science Maths 9th-E result.xlsx', 10, 2, 0, true],
    ['QPT-3 English 10th-M.xlsx', 37, 1, 0, false],
    ['QPT-4 Science 7th result.xlsx', 5, 1, 0, false],
    ['QPT-6 Maths F-1 result.xlsx', 76, 1, 4, false],
  ] as const

  it.each(cases)(
    'parses %s without exposing source values in test output',
    async (filename, expectedRows, expectedSubjects, negativeScores, quarantined) => {
      const bytes = await readFile(path.join(privateFixtureDirectory!, filename))
      const parsed = await parseLegacyQptWorkbook(bytes, {
        sourceFilename: filename,
      })
      const safeSummary = {
        rowCount: parsed.rows.length,
        subjectCount: parsed.subjects.length,
        negativeScores: parsed.rows.filter(
          (row) => row.score !== null && Number(row.score) < 0,
        ).length,
        quarantined: parsed.reviewState === 'QUARANTINED',
      }

      expect(safeSummary).toEqual({
        rowCount: expectedRows,
        subjectCount: expectedSubjects,
        negativeScores,
        quarantined,
      })
    },
  )
})
