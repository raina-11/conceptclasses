import { Decimal } from 'decimal.js'
import ExcelJS from 'exceljs'
import { inspectXlsxPackage } from './inspect-xlsx-package.ts'

const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024
const MAX_SCORE_ROWS = 10_000
const MAX_POPULATED_CELLS = 100_000
const POSTGRES_INTEGER_MAX = 2_147_483_647
const DATABASE_NUMERIC_ABSOLUTE_LIMIT = new Decimal(100_000_000)
const DATABASE_NUMERIC_SCALE = 4
const REQUIRED_SHEETS = ['Instructions', 'Assessment', 'Scores'] as const
const SCORE_HEADERS = [
  'roll_no',
  'student_name_for_review',
  'subject_code',
  'max_marks',
  'score',
  'status',
  'source_rank',
] as const
const REQUIRED_ASSESSMENT_FIELDS = [
  'template_version',
  'assessment_code',
  'academic_year',
  'qpt_number',
  'batch_code',
  'test_date',
  'display_title',
  'ranking_basis',
] as const
const ALLOWED_STATUSES = new Set([
  'PRESENT',
  'ABSENT',
  'WITHHELD',
  'CANCELLED',
  'NOT_ENROLLED',
  'OMITTED',
])

export type WorkbookIssue = {
  code: string
  message: string
  sheet?: string
  row?: number
  column?: number
}

export class WorkbookValidationError extends Error {
  readonly issues: WorkbookIssue[]

  constructor(issues: WorkbookIssue[]) {
    super('The workbook did not pass validation.')
    this.name = 'WorkbookValidationError'
    this.issues = issues
  }
}

export type ParsedAssessment = {
  templateVersion: string
  assessmentCode: string
  academicYear: string
  qptNumber: number
  batchCode: string
  testDate: string
  displayTitle: string
  rankingBasis: 'TOTAL_SCORE'
}

export type ParsedScoreRow = {
  sourceRow: number
  rollNo: string
  studentNameForReview: string
  subjectCode: string
  maxMarks: string
  score: string | null
  status: string
  sourceRank: number | null
}

export type ParsedQptWorkbook = {
  parserVersion: 'canonical-v1'
  assessment: ParsedAssessment
  rows: ParsedScoreRow[]
  warnings: WorkbookIssue[]
}

type PrimitiveCellValue = string | number | boolean | Date | null

function issue(
  code: string,
  message: string,
  location: Pick<WorkbookIssue, 'sheet' | 'row' | 'column'> = {},
): WorkbookIssue {
  return { code, message, ...location }
}

function isFormulaCell(cell: ExcelJS.Cell): boolean {
  const value = cell.value
  return (
    cell.type === ExcelJS.ValueType.Formula ||
    (typeof value === 'object' &&
      value !== null &&
      'formula' in value)
  )
}

function primitiveValue(cell: ExcelJS.Cell): PrimitiveCellValue {
  const value = cell.value

  if (value === null || typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean' || value instanceof Date) {
    return value
  }

  return null
}

function normalizedText(cell: ExcelJS.Cell): string {
  const value = primitiveValue(cell)
  if (value === null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

function decimalValue(
  cell: ExcelJS.Cell,
  field: string,
  issues: WorkbookIssue[],
): Decimal | null {
  const text = normalizedText(cell)
  if (text === '') return null

  try {
    const value = new Decimal(text)
    if (!value.isFinite()) throw new Error('not finite')
    if (
      value.abs().greaterThanOrEqualTo(DATABASE_NUMERIC_ABSOLUTE_LIMIT) ||
      value.decimalPlaces() > DATABASE_NUMERIC_SCALE
    ) {
      issues.push(
        issue(
          'numeric_out_of_range',
          `${field} must fit the portal numeric(12,4) storage range.`,
          {
            sheet: cell.worksheet.name,
            row: Number(cell.row),
            column: Number(cell.col),
          },
        ),
      )
      return null
    }
    return value
  } catch {
    issues.push(
      issue('invalid_number', `${field} must be a finite number.`, {
        sheet: cell.worksheet.name,
        row: Number(cell.row),
        column: Number(cell.col),
      }),
    )
    return null
  }
}

function positiveInteger(
  cell: ExcelJS.Cell,
  field: string,
  issues: WorkbookIssue[],
  required: boolean,
): number | null {
  const text = normalizedText(cell)
  if (text === '' && !required) return null
  const value = Number(text)
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > POSTGRES_INTEGER_MAX
  ) {
    issues.push(
      issue('invalid_positive_integer', `${field} must be a positive integer.`, {
        sheet: cell.worksheet.name,
        row: Number(cell.row),
        column: Number(cell.col),
      }),
    )
    return null
  }
  return value
}

function validateWorkbookResourceBounds(
  workbook: ExcelJS.Workbook,
  issues: WorkbookIssue[],
): boolean {
  const bounds = new Map<string, { rows: number; columns: number }>([
    ['Instructions', { rows: 200, columns: 20 }],
    ['Assessment', { rows: 64, columns: 2 }],
    // Leave a small bounded envelope for semantic validation to report an
    // unexpected column precisely; genuinely sparse/far-column input is still
    // rejected here before any row/column scan.
    ['Scores', { rows: MAX_SCORE_ROWS + 1, columns: 64 }],
  ])
  let populatedCells = 0
  let valid = true

  for (const worksheet of workbook.worksheets) {
    const limit = bounds.get(worksheet.name) ?? { rows: 1_000, columns: 64 }
    if (
      worksheet.rowCount > limit.rows ||
      worksheet.columnCount > limit.columns
    ) {
      valid = false
      issues.push(
        issue(
          'worksheet_dimension_exceeded',
          'A worksheet dimension exceeds the safe parser limit.',
          { sheet: worksheet.name },
        ),
      )
      continue
    }
    worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
      populatedCells += row.actualCellCount
    })
  }

  if (populatedCells > MAX_POPULATED_CELLS) {
    valid = false
    issues.push(
      issue(
        'workbook_cell_limit_exceeded',
        'The workbook contains too many populated cells.',
      ),
    )
  }
  return valid
}

function validateWorkbookShape(
  workbook: ExcelJS.Workbook,
  issues: WorkbookIssue[],
): void {
  const requiredNames = new Set<string>(REQUIRED_SHEETS)

  for (const worksheet of workbook.worksheets) {
    if (!requiredNames.has(worksheet.name)) {
      issues.push(
        issue(
          'unexpected_sheet',
          'The workbook contains an unexpected worksheet. Use only the official template sheets.',
        ),
      )
    }
    if (worksheet.state !== 'visible') {
      issues.push(
        issue('hidden_sheet', 'Hidden worksheets are not allowed.', {
          sheet: worksheet.name,
        }),
      )
    }

    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber)
      if (row.hidden && row.actualCellCount > 0) {
        issues.push(
          issue('hidden_row', 'Rows containing input data may not be hidden.', {
            sheet: worksheet.name,
            row: rowNumber,
          }),
        )
      }
    }
    for (
      let columnNumber = 1;
      columnNumber <= worksheet.columnCount;
      columnNumber += 1
    ) {
      if (worksheet.getColumn(columnNumber).hidden) {
        issues.push(
          issue('hidden_column', 'Input columns may not be hidden.', {
            sheet: worksheet.name,
            column: columnNumber,
          }),
        )
      }
    }

    worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
      row.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        if (isFormulaCell(cell)) {
          issues.push(
            issue('formula_not_allowed', 'Formula cells are not allowed.', {
              sheet: worksheet.name,
              row: Number(cell.row),
              column: Number(cell.col),
            }),
          )
        }
      })
    })
  }

  for (const name of REQUIRED_SHEETS) {
    if (!workbook.getWorksheet(name)) {
      issues.push(
        issue('missing_sheet', `Required worksheet "${name}" is missing.`, {
          sheet: name,
        }),
      )
    }
  }
}

function assessmentValues(
  worksheet: ExcelJS.Worksheet,
  issues: WorkbookIssue[],
): Map<string, ExcelJS.Cell> {
  if (
    normalizedText(worksheet.getCell(1, 1)) !== 'field' ||
    normalizedText(worksheet.getCell(1, 2)) !== 'value'
  ) {
    issues.push(
      issue(
        'invalid_assessment_header',
        'Assessment must start with the headers field and value.',
        { sheet: worksheet.name, row: 1 },
      ),
    )
  }

  const values = new Map<string, ExcelJS.Cell>()
  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const key = normalizedText(worksheet.getCell(rowNumber, 1))
    if (key === '') continue
    if (values.has(key)) {
      issues.push(
        issue('duplicate_assessment_field', 'An Assessment field is duplicated.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 1,
        }),
      )
      continue
    }
    values.set(key, worksheet.getCell(rowNumber, 2))
  }

  for (const field of REQUIRED_ASSESSMENT_FIELDS) {
    if (!values.has(field) || normalizedText(values.get(field)!) === '') {
      issues.push(
        issue('missing_assessment_field', `Assessment field "${field}" is required.`, {
          sheet: worksheet.name,
        }),
      )
    }
  }
  for (const field of values.keys()) {
    if (!(REQUIRED_ASSESSMENT_FIELDS as readonly string[]).includes(field)) {
      issues.push(
        issue('unexpected_assessment_field', 'Assessment contains an unsupported field.', {
          sheet: worksheet.name,
        }),
      )
    }
  }

  return values
}

function parseAssessment(
  worksheet: ExcelJS.Worksheet,
  issues: WorkbookIssue[],
): ParsedAssessment | null {
  const values = assessmentValues(worksheet, issues)
  if (REQUIRED_ASSESSMENT_FIELDS.some((field) => !values.has(field))) return null

  const text = (field: (typeof REQUIRED_ASSESSMENT_FIELDS)[number]) =>
    normalizedText(values.get(field)!)
  const qptNumber = positiveInteger(values.get('qpt_number')!, 'qpt_number', issues, true)
  const testDate = text('test_date')
  const date = new Date(`${testDate}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(testDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== testDate
  ) {
    issues.push(
      issue('invalid_test_date', 'test_date must be a valid YYYY-MM-DD date.', {
        sheet: worksheet.name,
      }),
    )
  }

  const rankingBasis = text('ranking_basis')
  if (rankingBasis !== 'TOTAL_SCORE') {
    issues.push(
      issue('invalid_ranking_basis', 'ranking_basis must be TOTAL_SCORE.', {
        sheet: worksheet.name,
      }),
    )
  }

  const templateVersion = text('template_version')
  if (templateVersion !== '1') {
    issues.push(
      issue('unsupported_template_version', 'Only template version 1 is supported.', {
        sheet: worksheet.name,
      }),
    )
  }

  if (qptNumber === null) return null
  return {
    templateVersion,
    assessmentCode: text('assessment_code'),
    academicYear: text('academic_year'),
    qptNumber,
    batchCode: text('batch_code'),
    testDate,
    displayTitle: text('display_title'),
    rankingBasis: 'TOTAL_SCORE',
  }
}

function validateScoreHeaders(
  worksheet: ExcelJS.Worksheet,
  issues: WorkbookIssue[],
): boolean {
  let valid = true
  for (let index = 0; index < SCORE_HEADERS.length; index += 1) {
    const actual = normalizedText(worksheet.getCell(1, index + 1))
    const expected = SCORE_HEADERS[index]
    if (actual !== expected) {
      valid = false
      issues.push(
        issue(
          'invalid_score_header',
          `Column ${index + 1} must be named "${expected}".`,
          { sheet: worksheet.name, row: 1, column: index + 1 },
        ),
      )
    }
  }
  if (worksheet.actualColumnCount > SCORE_HEADERS.length) {
    valid = false
    issues.push(
      issue('unexpected_score_column', 'Scores contains an unexpected column.', {
        sheet: worksheet.name,
        row: 1,
        column: SCORE_HEADERS.length + 1,
      }),
    )
  }
  return valid
}

function parseScores(
  worksheet: ExcelJS.Worksheet,
  issues: WorkbookIssue[],
): ParsedScoreRow[] {
  if (!validateScoreHeaders(worksheet, issues)) return []
  if (worksheet.actualRowCount - 1 > MAX_SCORE_ROWS) {
    issues.push(
      issue('too_many_rows', `Scores may contain at most ${MAX_SCORE_ROWS} rows.`, {
        sheet: worksheet.name,
      }),
    )
    return []
  }

  const rows: ParsedScoreRow[] = []
  const seen = new Set<string>()
  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    if (row.actualCellCount === 0) continue

    const rollCell = row.getCell(1)
    const rollNo = normalizedText(rollCell)
    const name = normalizedText(row.getCell(2))
    const subjectCode = normalizedText(row.getCell(3)).toUpperCase()
    const maxMarks = decimalValue(row.getCell(4), 'max_marks', issues)
    const scoreCell = row.getCell(5)
    const scoreHasFormula = isFormulaCell(scoreCell)
    const score = decimalValue(scoreCell, 'score', issues)
    const status = normalizedText(row.getCell(6)).toUpperCase()
    const sourceRank = positiveInteger(
      row.getCell(7),
      'source_rank',
      issues,
      false,
    )

    if (typeof rollCell.value !== 'string' || rollNo === '') {
      issues.push(
        issue(
          'invalid_roll_no',
          'roll_no is required and must be stored as text to preserve leading zeroes.',
          { sheet: worksheet.name, row: rowNumber, column: 1 },
        ),
      )
    }
    if (name === '') {
      issues.push(
        issue('missing_student_name', 'student_name_for_review is required.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 2,
        }),
      )
    }
    if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(subjectCode)) {
      issues.push(
        issue('invalid_subject_code', 'subject_code has an invalid format.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 3,
        }),
      )
    }
    if (maxMarks === null || !maxMarks.isPositive()) {
      issues.push(
        issue('invalid_max_marks', 'max_marks must be greater than zero.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 4,
        }),
      )
    }
    if (!ALLOWED_STATUSES.has(status)) {
      issues.push(
        issue('invalid_status', 'status is not an approved result status.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 6,
        }),
      )
    }
    if (status === 'PRESENT' && score === null && !scoreHasFormula) {
      issues.push(
        issue('missing_score', 'PRESENT rows require a score.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 5,
        }),
      )
    }
    if (status !== 'PRESENT' && score !== null) {
      issues.push(
        issue('score_not_allowed', 'Only PRESENT rows may contain a score.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 5,
        }),
      )
    }
    if (maxMarks !== null && score !== null && score.greaterThan(maxMarks)) {
      issues.push(
        issue('score_above_maximum', 'score cannot exceed max_marks.', {
          sheet: worksheet.name,
          row: rowNumber,
          column: 5,
        }),
      )
    }

    const duplicateKey = `${rollNo.toUpperCase()}\u0000${subjectCode}`
    if (seen.has(duplicateKey)) {
      issues.push(
        issue(
          'duplicate_score_row',
          'A student may appear only once per subject.',
          { sheet: worksheet.name, row: rowNumber },
        ),
      )
    }
    seen.add(duplicateKey)

    rows.push({
      sourceRow: rowNumber,
      rollNo,
      studentNameForReview: name,
      subjectCode,
      maxMarks: maxMarks?.toString() ?? '',
      score: status === 'PRESENT' ? (score?.toString() ?? null) : null,
      status,
      sourceRank,
    })
  }

  if (rows.length === 0) {
    issues.push(
      issue('no_score_rows', 'Scores must contain at least one result row.', {
        sheet: worksheet.name,
      }),
    )
  }
  return rows
}

export async function parseQptWorkbook(
  bytes: Uint8Array,
): Promise<ParsedQptWorkbook> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_WORKBOOK_BYTES) {
    throw new WorkbookValidationError([
      issue(
        'invalid_file_size',
        `Workbook size must be between 1 byte and ${MAX_WORKBOOK_BYTES} bytes.`,
      ),
    ])
  }

  const packageIssues = await inspectXlsxPackage(bytes)
  if (packageIssues.length > 0) {
    throw new WorkbookValidationError(packageIssues)
  }

  const workbook = new ExcelJS.Workbook()
  try {
    const workbookBytes = new Uint8Array(bytes.byteLength)
    workbookBytes.set(bytes)
    await workbook.xlsx.load(workbookBytes.buffer)
  } catch {
    throw new WorkbookValidationError([
      issue('invalid_xlsx', 'The uploaded file is not a readable XLSX workbook.'),
    ])
  }

  const issues: WorkbookIssue[] = []
  if (!validateWorkbookResourceBounds(workbook, issues)) {
    throw new WorkbookValidationError(issues)
  }
  validateWorkbookShape(workbook, issues)

  const assessmentSheet = workbook.getWorksheet('Assessment')
  const scoresSheet = workbook.getWorksheet('Scores')
  const assessment = assessmentSheet
    ? parseAssessment(assessmentSheet, issues)
    : null
  const rows = scoresSheet ? parseScores(scoresSheet, issues) : []

  if (issues.length > 0 || assessment === null) {
    throw new WorkbookValidationError(issues)
  }

  return {
    parserVersion: 'canonical-v1',
    assessment,
    rows,
    warnings: [],
  }
}
