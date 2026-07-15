import ExcelJS from 'exceljs'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const outputUrl = new URL('../public/templates/qpt-import-template.xlsx', import.meta.url)
await mkdir(fileURLToPath(new URL('.', outputUrl)), { recursive: true })

const workbook = new ExcelJS.Workbook()
workbook.creator = 'Concept Institute'
workbook.created = new Date('2026-07-14T00:00:00.000Z')
workbook.modified = new Date('2026-07-14T00:00:00.000Z')

const headingFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF47B5E' } }
const softFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F0E8' } }
const border = {
  top: { style: 'thin', color: { argb: 'FFD6CFC4' } },
  left: { style: 'thin', color: { argb: 'FFD6CFC4' } },
  bottom: { style: 'thin', color: { argb: 'FFD6CFC4' } },
  right: { style: 'thin', color: { argb: 'FFD6CFC4' } },
}

const instructions = workbook.addWorksheet('Instructions', {
  views: [{ state: 'frozen', ySplit: 1 }],
})
instructions.columns = [{ width: 110 }]
instructions.addRows([
  ['Concept Institute · QPT result import template v1'],
  ['1. Fill every value on the Assessment sheet. Keep template_version as 1.'],
  ['2. Add one Scores row per student and subject. Store roll_no as text so leading zeroes are preserved.'],
  ['3. Allowed status values: PRESENT, ABSENT, WITHHELD, CANCELLED, NOT_ENROLLED, OMITTED.'],
  ['4. PRESENT requires a numeric score. Other statuses require a blank score. Negative marks are allowed.'],
  ['5. Do not add worksheets, columns, formulas, comments, hidden rows, phone numbers, or answer data.'],
  ['6. Uploading creates a private draft. A different authorised staff member must publish it.'],
])
instructions.getRow(1).height = 28
instructions.getCell('A1').fill = headingFill
instructions.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }

const assessment = workbook.addWorksheet('Assessment', {
  views: [{ state: 'frozen', ySplit: 1 }],
})
assessment.columns = [{ width: 28 }, { width: 44 }]
assessment.addRows([
  ['field', 'value'],
  ['template_version', '1'],
  ['assessment_code', ''],
  ['academic_year', ''],
  ['qpt_number', ''],
  ['batch_code', ''],
  ['test_date', ''],
  ['display_title', ''],
  ['ranking_basis', 'TOTAL_SCORE'],
])
assessment.getRow(1).eachCell((cell) => {
  cell.fill = headingFill
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  cell.border = border
})
for (let row = 2; row <= assessment.rowCount; row += 1) {
  assessment.getCell(row, 1).fill = softFill
  assessment.getRow(row).eachCell((cell) => {
    cell.border = border
  })
}
assessment.getCell('B5').dataValidation = {
  type: 'whole',
  operator: 'greaterThan',
  formulae: [0],
  allowBlank: false,
  showErrorMessage: true,
  error: 'Enter a positive QPT number.',
}
assessment.getCell('B7').dataValidation = {
  type: 'date',
  operator: 'between',
  formulae: [new Date('2020-01-01T00:00:00.000Z'), new Date('2100-12-31T00:00:00.000Z')],
  allowBlank: false,
  showErrorMessage: true,
  error: 'Enter a valid test date.',
}

const scores = workbook.addWorksheet('Scores', {
  views: [{ state: 'frozen', ySplit: 1 }],
})
scores.columns = [
  { key: 'roll_no', width: 20, style: { numFmt: '@' } },
  { key: 'student_name_for_review', width: 34 },
  { key: 'subject_code', width: 18 },
  { key: 'max_marks', width: 15 },
  { key: 'score', width: 15 },
  { key: 'status', width: 20 },
  { key: 'source_rank', width: 15 },
]
scores.addRow([
  'roll_no',
  'student_name_for_review',
  'subject_code',
  'max_marks',
  'score',
  'status',
  'source_rank',
])
scores.getRow(1).eachCell((cell) => {
  cell.fill = headingFill
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  cell.border = border
})
for (let row = 2; row <= 1001; row += 1) {
  scores.getCell(row, 1).numFmt = '@'
  scores.getCell(row, 6).dataValidation = {
    type: 'list',
    formulae: ['"PRESENT,ABSENT,WITHHELD,CANCELLED,NOT_ENROLLED,OMITTED"'],
    allowBlank: true,
    showErrorMessage: true,
    error: 'Choose one of the approved status values.',
  }
}
scores.autoFilter = 'A1:G1'

await workbook.xlsx.writeFile(fileURLToPath(outputUrl))
console.log(fileURLToPath(outputUrl))
