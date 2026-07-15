import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import {
  parseQptWorkbook,
  WorkbookValidationError,
} from './parse-workbook'

type ScoreInput = {
  rollNo: string
  studentName: string
  subjectCode: string
  maxMarks: number
  score: number | null
  status: string
  sourceRank?: number
}

async function canonicalWorkbook(
  scores: ScoreInput[],
  mutate?: (workbook: ExcelJS.Workbook) => void,
) {
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Instructions').addRow(['QPT Template v1'])

  const assessment = workbook.addWorksheet('Assessment')
  assessment.addRows([
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

  const sheet = workbook.addWorksheet('Scores')
  sheet.addRow([
    'roll_no',
    'student_name_for_review',
    'subject_code',
    'max_marks',
    'score',
    'status',
    'source_rank',
  ])
  scores.forEach((row) => {
    sheet.addRow([
      row.rollNo,
      row.studentName,
      row.subjectCode,
      row.maxMarks,
      row.score,
      row.status,
      row.sourceRank ?? null,
    ])
  })

  mutate?.(workbook)
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}

describe('parseQptWorkbook', () => {
  it('normalizes a canonical workbook without losing roll formatting or negative marks', async () => {
    const bytes = await canonicalWorkbook([
      {
        rollNo: '0012',
        studentName: 'Student A',
        subjectCode: 'PHY',
        maxMarks: 100,
        score: -1.5,
        status: 'PRESENT',
        sourceRank: 2,
      },
      {
        rollNo: '0013',
        studentName: 'Student B',
        subjectCode: 'PHY',
        maxMarks: 100,
        score: null,
        status: 'ABSENT',
      },
    ])

    const result = await parseQptWorkbook(bytes)

    expect(result.assessment).toEqual({
      templateVersion: '1',
      assessmentCode: 'QPT-2026-06',
      academicYear: '2026-27',
      qptNumber: 6,
      batchCode: '10-E',
      testDate: '2026-07-13',
      displayTitle: 'QPT 06',
      rankingBasis: 'TOTAL_SCORE',
    })
    expect(result.rows).toEqual([
      expect.objectContaining({
        sourceRow: 2,
        rollNo: '0012',
        subjectCode: 'PHY',
        maxMarks: '100',
        score: '-1.5',
        status: 'PRESENT',
        sourceRank: 2,
      }),
      expect.objectContaining({
        sourceRow: 3,
        rollNo: '0013',
        score: null,
        status: 'ABSENT',
        sourceRank: null,
      }),
    ])
    expect(result.warnings).toEqual([])
  })

  it('rejects unexpected sheets before returning any student rows', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'CHEM',
          maxMarks: 80,
          score: 64,
          status: 'PRESENT',
        },
      ],
      (workbook) => workbook.addWorksheet('phone-data'),
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'unexpected_sheet' })],
    })
  })

  it('rejects formula cells in canonical input areas', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
        },
      ],
      (workbook) => {
        workbook.getWorksheet('Scores')!.getCell('E2').value = {
          formula: '40+35',
          result: 75,
        }
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toBeInstanceOf(
      WorkbookValidationError,
    )
    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'formula_not_allowed' })],
    })
  })

  it('rejects duplicate student and subject rows', async () => {
    const duplicate = {
      rollNo: '21',
      studentName: 'Student A',
      subjectCode: 'BIO',
      maxMarks: 100,
      score: 81,
      status: 'PRESENT',
    }
    const bytes = await canonicalWorkbook([duplicate, duplicate])

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'duplicate_score_row' })],
    })
  })

  it('rejects a generic ZIP that is not an XLSX package', async () => {
    const archive = new JSZip()
    archive.file('readme.txt', 'not a workbook')
    const bytes = await archive.generateAsync({ type: 'uint8array' })

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'not_an_xlsx_package' })],
    })
  })

  it('rejects external workbook relationships before parsing cells', async () => {
    const bytes = await canonicalWorkbook([
      {
        rollNo: '1',
        studentName: 'Student A',
        subjectCode: 'MATH',
        maxMarks: 100,
        score: 75,
        status: 'PRESENT',
      },
    ])
    const archive = await JSZip.loadAsync(bytes)
    archive.file(
      '_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="external" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.invalid/" TargetMode="External"/></Relationships>',
    )
    const withExternalRelationship = await archive.generateAsync({
      type: 'uint8array',
    })

    await expect(
      parseQptWorkbook(withExternalRelationship),
    ).rejects.toMatchObject({
      issues: [
        expect.objectContaining({ code: 'external_relationship_not_allowed' }),
      ],
    })
  })

  it('rejects data hidden in an unnamed extra score column', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
        },
      ],
      (workbook) => {
        workbook.getWorksheet('Scores')!.getCell('H2').value = 'REDACTED'
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'unexpected_score_column' })],
    })
  })

  it('rejects hidden rows and columns in canonical input sheets', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
        },
      ],
      (workbook) => {
        const scores = workbook.getWorksheet('Scores')!
        scores.getRow(2).hidden = true
        scores.getColumn(5).hidden = true
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'hidden_row' }),
        expect.objectContaining({ code: 'hidden_column' }),
      ]),
    })
  })

  it.each(['A1048576', 'XFD2'])(
    'rejects a sparse canonical cell at %s before scanning worksheet dimensions',
    async (address) => {
      const bytes = await canonicalWorkbook(
        [
          {
            rollNo: '1',
            studentName: 'Student A',
            subjectCode: 'MATH',
            maxMarks: 100,
            score: 75,
            status: 'PRESENT',
          },
        ],
        (workbook) => {
          workbook.getWorksheet('Scores')!.getCell(address).value = 'sparse'
        },
      )

      await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
        issues: [
          expect.objectContaining({ code: 'worksheet_dimension_exceeded' }),
        ],
      })
    },
  )

  it('rejects decimals that cannot fit numeric(12,4)', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
        },
      ],
      (workbook) => {
        workbook.getWorksheet('Scores')!.getCell('D2').value = '99999999.99999'
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'numeric_out_of_range' }),
      ]),
    })
  })

  it('rejects workbooks whose populated cells exceed the parser budget', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
        },
      ],
      (workbook) => {
        for (const sheetName of ['Extra A', 'Extra B']) {
          const sheet = workbook.addWorksheet(sheetName)
          for (let row = 1; row <= 800; row += 1) {
            for (let column = 1; column <= 64; column += 1) {
              sheet.getCell(row, column).value = `${row}-${column}`
            }
          }
        }
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'workbook_cell_limit_exceeded' }),
      ]),
    })
  })

  it('rejects positive integers outside the PostgreSQL integer range', async () => {
    const bytes = await canonicalWorkbook(
      [
        {
          rollNo: '1',
          studentName: 'Student A',
          subjectCode: 'MATH',
          maxMarks: 100,
          score: 75,
          status: 'PRESENT',
          sourceRank: 1,
        },
      ],
      (workbook) => {
        workbook.getWorksheet('Assessment')!.getCell('B5').value = 2_147_483_648
        workbook.getWorksheet('Scores')!.getCell('G2').value = 2_147_483_648
      },
    )

    await expect(parseQptWorkbook(bytes)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'invalid_positive_integer' }),
        expect.objectContaining({ code: 'invalid_positive_integer' }),
      ]),
    })
  })

  it('rejects comment parts that could retain undisplayed source data', async () => {
    const bytes = await canonicalWorkbook([
      {
        rollNo: '1',
        studentName: 'Student A',
        subjectCode: 'MATH',
        maxMarks: 100,
        score: 75,
        status: 'PRESENT',
      },
    ])
    const archive = await JSZip.loadAsync(bytes)
    archive.file('xl/comments1.xml', '<comments><text>REDACTED</text></comments>')
    const withCommentPart = await archive.generateAsync({ type: 'uint8array' })

    await expect(parseQptWorkbook(withCommentPart)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'disallowed_xlsx_part' })],
    })
  })
})
