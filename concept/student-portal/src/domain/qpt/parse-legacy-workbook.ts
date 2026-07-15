import { Decimal } from 'decimal.js'
import ExcelJS from 'exceljs'
import { inspectXlsxPackage } from './inspect-xlsx-package.ts'
import {
  WorkbookValidationError,
  type WorkbookIssue,
} from './parse-workbook.ts'

export { WorkbookValidationError } from './parse-workbook.ts'

const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024
const MAX_STUDENT_ROWS = 10_000
const HEADER_SCAN_ROWS = 25
const MAX_DISPLAY_ROWS = MAX_STUDENT_ROWS + HEADER_SCAN_ROWS
const MAX_DISPLAY_COLUMNS = 64
const MAX_DISPLAY_POPULATED_CELLS = 200_000
const POSTGRES_INTEGER_MAX = 2_147_483_647
const DATABASE_NUMERIC_ABSOLUTE_LIMIT = new Decimal(100_000_000)
const DATABASE_NUMERIC_SCALE = 4

type CellPrimitive = string | number | boolean | Date | null

export type LegacySubject = {
  sourceColumn: number
  name: string
  code: string
  maxMarks: string
}

export type LegacyScoreRow = {
  sourceRow: number
  rollNo: string
  studentNameForReview: string
  batchCode: string
  subjectCode: string
  maxMarks: string
  score: string | null
  status: 'PRESENT' | 'ABSENT'
  sourceRank: number | null
  sourcePercentage: string | null
}

export type ParsedLegacyWorkbook = {
  parserVersion: 'legacy-sheet1-v1'
  assessment: {
    qptNumber: number
    batchCode: string
    testDate: string
    academicYear: string
    displayTitle: string
    assessmentCode: string
    rankingBasis: 'SOURCE_DISPLAY_RANK'
  }
  subjects: LegacySubject[]
  rows: LegacyScoreRow[]
  reviewState: 'READY_FOR_REVIEW' | 'QUARANTINED'
  blockingIssues: WorkbookIssue[]
  warnings: WorkbookIssue[]
}

type ParseContext = {
  issues: WorkbookIssue[]
  missingFormulaResults: Set<string>
  invalidCellResults: Set<string>
}

function location(cell: ExcelJS.Cell) {
  return {
    sheet: cell.worksheet.name,
    row: Number(cell.row),
    column: Number(cell.col),
  }
}

function formulaResult(cell: ExcelJS.Cell): ExcelJS.CellValue | undefined {
  return (cell as ExcelJS.Cell & { result?: ExcelJS.CellValue }).result
}

function primitiveCellValue(
  cell: ExcelJS.Cell,
  context: ParseContext,
): CellPrimitive {
  let value: ExcelJS.CellValue | undefined = cell.value
  if (cell.type === ExcelJS.ValueType.Formula) {
    value = formulaResult(cell)
    if (value === null || value === undefined) {
      const key = `${cell.worksheet.name}!${cell.address}`
      if (!context.missingFormulaResults.has(key)) {
        context.missingFormulaResults.add(key)
        context.issues.push({
          code: 'formula_result_missing',
          message: 'A displayed Sheet1 formula has no cached result.',
          ...location(cell),
        })
      }
      return null
    }
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return value
  }
  if (typeof value === 'object' && 'error' in value) {
    const key = `${cell.worksheet.name}!${cell.address}`
    if (!context.invalidCellResults.has(key)) {
      context.invalidCellResults.add(key)
      context.issues.push({
        code:
          cell.type === ExcelJS.ValueType.Formula
            ? 'formula_result_invalid'
            : 'cell_error_not_allowed',
        message: 'Spreadsheet error values are not valid result data.',
        ...location(cell),
      })
    }
    return null
  }
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part: { text: string }) => part.text).join('')
  }
  return null
}

function cellText(cell: ExcelJS.Cell, context: ParseContext): string {
  const value = primitiveCellValue(cell, context)
  if (value === null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).replace(/\s+/g, ' ').trim()
}

function decimalFromCell(
  cell: ExcelJS.Cell,
  context: ParseContext,
  fieldName: string,
  required: boolean,
): Decimal | null {
  const text = cellText(cell, context)
  if (text === '') {
    if (required && cell.type !== ExcelJS.ValueType.Formula) {
      context.issues.push({
        code: 'missing_numeric_value',
        message: `${fieldName} is required.`,
        ...location(cell),
      })
    }
    return null
  }
  try {
    const value = new Decimal(text.replace(/,/g, ''))
    if (!value.isFinite()) throw new Error('not finite')
    return value
  } catch {
    context.issues.push({
      code: 'invalid_number',
      message: `${fieldName} must be a finite number.`,
      ...location(cell),
    })
    return null
  }
}

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase()
}

function fitsDatabaseNumeric(value: Decimal): boolean {
  return (
    value.abs().lessThan(DATABASE_NUMERIC_ABSOLUTE_LIMIT) &&
    value.decimalPlaces() <= DATABASE_NUMERIC_SCALE
  )
}

function subjectCode(name: string): string {
  const canonical = /^MATHEMATICS$/i.test(name.trim()) ? 'MATHS' : name.trim()
  return canonical
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 32)
}

function parseHeaderSubject(
  text: string,
  sourceColumn: number,
  sheetName: string,
  issues: WorkbookIssue[],
): LegacySubject | null {
  const match = text.match(/^(.+?)\s*\(([-+]?\d+(?:\.\d+)?)\)\s*$/)
  if (!match) {
    issues.push({
      code: 'invalid_subject_header',
      message: 'Subject headers must use the format Subject (maximum marks).',
      sheet: sheetName,
      row: 3,
      column: sourceColumn,
    })
    return null
  }
  const name = match[1].trim()
  const maxMarks = new Decimal(match[2])
  const code = subjectCode(name)
  if (!fitsDatabaseNumeric(maxMarks)) {
    issues.push({
      code: 'numeric_out_of_range',
      message: 'Subject maximum marks must fit the portal numeric(12,4) storage range.',
      sheet: sheetName,
      row: 3,
      column: sourceColumn,
    })
    return null
  }
  if (!maxMarks.isPositive() || code === '') {
    issues.push({
      code: 'invalid_subject_header',
      message: 'The subject name and maximum marks must be valid.',
      sheet: sheetName,
      row: 3,
      column: sourceColumn,
    })
    return null
  }
  return { sourceColumn, name, code, maxMarks: maxMarks.toString() }
}

function findHeaderRow(
  sheet: ExcelJS.Worksheet,
  context: ParseContext,
): number | null {
  const limit = Math.min(HEADER_SCAN_ROWS, sheet.rowCount)
  for (let rowNumber = 1; rowNumber <= limit; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const values = [1, 2, 3].map((column) =>
      normalized(cellText(row.getCell(column), context)),
    )
    if (
      values[0] === 'ROLLNO.' ||
      values[0] === 'ROLLNO' ||
      values[0] === 'ROLLNUMBER'
    ) {
      if (values[1] === 'BATCH' && values[2] === 'STUDENTNAME') {
        return rowNumber
      }
    }
  }
  return null
}

function parseTitle(title: string): {
  qptNumber: number
  batchCode: string
  testDate: string
} | null {
  const qptMatch = title.match(/QPT\s*[-–—]?\s*(\d+)/i)
  const batchAndDate = title.match(
    /\bBatch\s+(.+?)\s*\((\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\)/i,
  )
  if (!qptMatch || !batchAndDate) return null

  const day = Number(batchAndDate[2])
  const month = Number(batchAndDate[3])
  const year = Number(batchAndDate[4])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  const qptNumber = Number(qptMatch[1])
  if (
    !Number.isSafeInteger(qptNumber) ||
    qptNumber <= 0 ||
    qptNumber > POSTGRES_INTEGER_MAX
  ) {
    return null
  }

  return {
    qptNumber,
    batchCode: batchAndDate[1].trim(),
    testDate: `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
  }
}

function academicYearFor(testDate: string): string {
  const [yearText, monthText] = testDate.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const startYear = month >= 4 ? year : year - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

function escapedPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function filenameHasBatchSegment(
  sourceFilename: string,
  titleBatch: string,
): boolean {
  const stem = (sourceFilename.split(/[\\/]/).pop() ?? '')
    .replace(/\.xlsx$/i, '')
    .replace(/results?$/i, '')
  const expected = normalized(titleBatch)
  if (expected === '') return false

  return stem
    .normalize('NFKC')
    .replace(/[‐‑‒–—−]/g, '-')
    .split(/[^\p{L}\p{N}-]+/u)
    .map(normalized)
    .some((segment) => segment === expected)
}

function inferFilenameBatch(
  sourceFilename: string,
  qptNumber: number,
  subjects: LegacySubject[],
): string | null {
  let stem = (sourceFilename.split(/[\\/]/).pop() ?? '').replace(/\.xlsx$/i, '')
  stem = stem.replace(/\b(?:obj(?:ective)?|subj(?:ective)?)\.?\b/gi, ' ')
  stem = stem.replace(new RegExp(`\\bQPT\\s*[-–—]?\\s*${qptNumber}\\b`, 'i'), ' ')
  stem = stem.replace(/\bresults?\b/gi, ' ')
  for (const subject of subjects) {
    const variants = new Set([subject.name])
    if (/^math(?:s|ematics)$/i.test(subject.name)) {
      variants.add('Maths')
      variants.add('Mathematics')
    }
    for (const variant of variants) {
      stem = stem.replace(
        new RegExp(`\\b${escapedPattern(variant)}\\b`, 'gi'),
        ' ',
      )
    }
  }
  const candidate = stem.replace(/[,()[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  return candidate || null
}

function compactCodePart(value: string, maximumLength: number): string {
  if (value.length <= maximumLength) return value

  // FNV-1a 64-bit keeps long legacy labels deterministic without allowing an
  // arbitrary spreadsheet title to exceed the database identifier boundary.
  let hash = 0xcbf29ce484222325n
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0) ?? 0)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  const suffix = hash.toString(16).padStart(16, '0')
  return `${value.slice(0, maximumLength - suffix.length - 1)}-${suffix}`
}

function assessmentCode(
  qptNumber: number,
  testDate: string,
  batch: string,
  subjects: LegacySubject[],
): string {
  const safeBatch = compactCodePart(
    normalized(batch).replace(/[^A-Z0-9-]/g, ''),
    28,
  )
  const subjectSignature = compactCodePart(
    subjects
      .map((subject) => subject.code)
      .sort()
      .join('-'),
    40,
  )
  return `QPT-${qptNumber}-${testDate}-${safeBatch}-${subjectSignature}`
}

export async function parseLegacyQptWorkbook(
  bytes: Uint8Array,
  options: { sourceFilename: string },
): Promise<ParsedLegacyWorkbook> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_WORKBOOK_BYTES) {
    throw new WorkbookValidationError([
      {
        code: 'invalid_file_size',
        message: 'The workbook must be a non-empty XLSX file no larger than 10 MiB.',
      },
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
      { code: 'invalid_xlsx', message: 'The workbook could not be read.' },
    ])
  }

  const issues: WorkbookIssue[] = []
  const warnings: WorkbookIssue[] = []
  const blockingIssues: WorkbookIssue[] = []
  const context: ParseContext = {
    issues,
    missingFormulaResults: new Set(),
    invalidCellResults: new Set(),
  }
  const sheet = workbook.getWorksheet('Sheet1')
  if (!sheet) {
    throw new WorkbookValidationError([
      {
        code: 'missing_display_sheet',
        message: 'The legacy workbook must contain a Sheet1 display tab.',
      },
    ])
  }
  if (sheet.state !== 'visible') {
    issues.push({
      code: 'display_sheet_hidden',
      message: 'The Sheet1 display tab must be visible.',
      sheet: sheet.name,
    })
  }

  if (
    sheet.rowCount > MAX_DISPLAY_ROWS ||
    sheet.columnCount > MAX_DISPLAY_COLUMNS
  ) {
    throw new WorkbookValidationError([
      {
        code: 'worksheet_dimension_exceeded',
        message: 'Sheet1 dimensions exceed the safe legacy parser limit.',
        sheet: sheet.name,
      },
    ])
  }
  let populatedCells = 0
  sheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
    populatedCells += row.actualCellCount
  })
  if (populatedCells > MAX_DISPLAY_POPULATED_CELLS) {
    throw new WorkbookValidationError([
      {
        code: 'workbook_cell_limit_exceeded',
        message: 'Sheet1 contains too many populated cells.',
        sheet: sheet.name,
      },
    ])
  }

  const headerRow = findHeaderRow(sheet, context)
  if (headerRow === null) {
    issues.push({
      code: 'missing_display_header',
      message: 'Sheet1 does not contain the expected result-table headers.',
      sheet: sheet.name,
    })
    throw new WorkbookValidationError(issues)
  }

  let totalColumn = 0
  let percentageColumn = 0
  let rankColumn = 0
  const header = sheet.getRow(headerRow)
  for (let column = 4; column <= sheet.actualColumnCount; column += 1) {
    const value = normalized(cellText(header.getCell(column), context))
    if (value.startsWith('G.TOTAL(') || value.startsWith('GRANDTOTAL(')) {
      totalColumn = column
    } else if (value === '%AGE' || value === 'PERCENTAGE') {
      percentageColumn = column
    } else if (value === 'RANK') {
      rankColumn = column
    }
  }
  if (
    totalColumn < 5 ||
    percentageColumn !== totalColumn + 1 ||
    rankColumn !== totalColumn + 2
  ) {
    issues.push({
      code: 'invalid_display_columns',
      message: 'Sheet1 must end with G.Total, %age, and Rank columns.',
      sheet: sheet.name,
      row: headerRow,
    })
  }

  const subjects: LegacySubject[] = []
  if (totalColumn > 4) {
    for (let column = 4; column < totalColumn; column += 1) {
      const parsed = parseHeaderSubject(
        cellText(header.getCell(column), context),
        column,
        sheet.name,
        issues,
      )
      if (parsed) subjects.push(parsed)
    }
  }
  if (subjects.length === 0) {
    issues.push({
      code: 'missing_subject_columns',
      message: 'Sheet1 must contain at least one subject result column.',
      sheet: sheet.name,
      row: headerRow,
    })
  }

  const title = cellText(sheet.getCell(1, 1), context)
  const titleMetadata = parseTitle(title)
  if (!titleMetadata) {
    issues.push({
      code: 'invalid_display_title',
      message: 'Sheet1 title must contain QPT number, batch, and test date.',
      sheet: sheet.name,
      row: 1,
      column: 1,
    })
  }

  if (issues.length > 0 || !titleMetadata) {
    throw new WorkbookValidationError(issues)
  }

  const studentRows: LegacyScoreRow[] = []
  const seenRolls = new Set<string>()
  let sourceStudentCount = 0
  const rowBatchValues = new Set<string>()
  for (
    let rowNumber = headerRow + 1;
    rowNumber <= sheet.rowCount;
    rowNumber += 1
  ) {
    const row = sheet.getRow(rowNumber)
    const rollNo = cellText(row.getCell(1), context)
    const studentName = cellText(row.getCell(3), context)
    if (rollNo === '' && studentName === '') continue
    sourceStudentCount += 1
    if (sourceStudentCount > MAX_STUDENT_ROWS) {
      issues.push({
        code: 'too_many_rows',
        message: `Sheet1 may contain at most ${MAX_STUDENT_ROWS} student rows.`,
        sheet: sheet.name,
      })
      break
    }

    const batchCode = cellText(row.getCell(2), context)
    if (rollNo === '' || studentName === '' || batchCode === '') {
      issues.push({
        code: 'incomplete_student_row',
        message: 'Every displayed student requires roll number, batch, and name.',
        sheet: sheet.name,
        row: rowNumber,
      })
      continue
    }
    const rollKey = normalized(rollNo)
    if (seenRolls.has(rollKey)) {
      issues.push({
        code: 'duplicate_student_row',
        message: 'A roll number appears more than once in Sheet1.',
        sheet: sheet.name,
        row: rowNumber,
      })
      continue
    }
    seenRolls.add(rollKey)
    rowBatchValues.add(normalized(batchCode))

    const sourceRankValue = decimalFromCell(
      row.getCell(rankColumn),
      context,
      'rank',
      true,
    )
    let sourceRank: number | null = null
    if (
      sourceRankValue !== null &&
      sourceRankValue.isInteger() &&
      sourceRankValue.isPositive() &&
      sourceRankValue.lessThanOrEqualTo(POSTGRES_INTEGER_MAX)
    ) {
      sourceRank = sourceRankValue.toNumber()
    } else if (sourceRankValue !== null) {
      issues.push({
        code: 'invalid_rank',
        message: 'Displayed rank must be a positive PostgreSQL integer.',
        ...location(row.getCell(rankColumn)),
      })
    }

    const percentage = decimalFromCell(
      row.getCell(percentageColumn),
      context,
      'percentage',
      true,
    )
    const displayedTotal = decimalFromCell(
      row.getCell(totalColumn),
      context,
      'grand total',
      true,
    )
    let calculatedTotal = new Decimal(0)
    let allScoresPresent = true

    for (const subject of subjects) {
      const score = decimalFromCell(
        row.getCell(subject.sourceColumn),
        context,
        `${subject.name} score`,
        false,
      )
      const storedScore =
        score !== null && fitsDatabaseNumeric(score) ? score : null
      if (score !== null && storedScore === null) {
        issues.push({
          code: 'numeric_out_of_range',
          message: 'A score must fit the portal numeric(12,4) storage range.',
          ...location(row.getCell(subject.sourceColumn)),
        })
      }
      if (storedScore === null) allScoresPresent = false
      else calculatedTotal = calculatedTotal.plus(storedScore)

      if (
        storedScore !== null &&
        storedScore.greaterThan(new Decimal(subject.maxMarks))
      ) {
        issues.push({
          code: 'score_above_maximum',
          message: 'A displayed score exceeds its subject maximum.',
          ...location(row.getCell(subject.sourceColumn)),
        })
      }
      studentRows.push({
        sourceRow: rowNumber,
        rollNo,
        studentNameForReview: studentName,
        batchCode,
        subjectCode: subject.code,
        maxMarks: subject.maxMarks,
        score: storedScore?.toString() ?? null,
        status: storedScore === null ? 'ABSENT' : 'PRESENT',
        sourceRank,
        sourcePercentage: percentage?.toString() ?? null,
      })
    }

    if (
      displayedTotal !== null &&
      allScoresPresent &&
      !displayedTotal.equals(calculatedTotal)
    ) {
      blockingIssues.push({
        code: 'display_total_mismatch',
        message: 'Displayed subject scores do not add up to the displayed grand total.',
        sheet: sheet.name,
        row: rowNumber,
      })
    }
  }

  if (sourceStudentCount === 0) {
    issues.push({
      code: 'no_student_rows',
      message: 'Sheet1 contains no student result rows.',
      sheet: sheet.name,
    })
  }
  if (issues.length > 0) throw new WorkbookValidationError(issues)

  const filenameQpt = options.sourceFilename.match(/QPT\s*[-–—]?\s*(\d+)/i)
  if (filenameQpt && Number(filenameQpt[1]) !== titleMetadata.qptNumber) {
    blockingIssues.push({
      code: 'filename_qpt_mismatch',
      message: 'The filename QPT number does not match the Sheet1 title.',
    })
  }
  if (!filenameHasBatchSegment(options.sourceFilename, titleMetadata.batchCode)) {
    const filenameBatch = inferFilenameBatch(
      options.sourceFilename,
      titleMetadata.qptNumber,
      subjects,
    )
    if (filenameBatch === null) {
      warnings.push({
        code: 'filename_batch_not_detected',
        message: 'The filename batch could not be detected for comparison.',
      })
    } else if (normalized(filenameBatch) !== normalized(titleMetadata.batchCode)) {
      blockingIssues.push({
        code: 'filename_batch_mismatch',
        message: 'The filename batch does not match the Sheet1 title.',
      })
    }
  }
  if (
    rowBatchValues.size !== 1 ||
    !rowBatchValues.has(normalized(titleMetadata.batchCode))
  ) {
    blockingIssues.push({
      code: 'row_batch_mismatch',
      message: 'Displayed student batches do not all match the Sheet1 title.',
      sheet: sheet.name,
    })
  }

  return {
    parserVersion: 'legacy-sheet1-v1',
    assessment: {
      qptNumber: titleMetadata.qptNumber,
      batchCode: titleMetadata.batchCode,
      testDate: titleMetadata.testDate,
      academicYear: academicYearFor(titleMetadata.testDate),
      displayTitle: title,
      assessmentCode: assessmentCode(
        titleMetadata.qptNumber,
        titleMetadata.testDate,
        titleMetadata.batchCode,
        subjects,
      ),
      rankingBasis: 'SOURCE_DISPLAY_RANK',
    },
    subjects,
    rows: studentRows,
    reviewState:
      blockingIssues.length > 0 ? 'QUARANTINED' : 'READY_FOR_REVIEW',
    blockingIssues,
    warnings,
  }
}
