import Decimal from 'decimal.js'

export type ResultStatus =
  | 'present'
  | 'absent'
  | 'withheld'
  | 'cancelled'
  | 'not_enrolled'
  | 'omitted'

export type StudentResultRow = {
  assessmentId: string
  assessmentCode: string
  qptNumber: number
  displayTitle: string
  testDate: string
  subjectCode: string
  subjectName: string
  maxMarks: string | number
  score: string | number | null
  status: ResultStatus
  rank: number | null
}

export type ResultSummary = {
  earnedMarks: string
  maximumMarks: string
  percentage: string | null
  includedRows: number
  pendingRows: number
}

const EXCLUDED_STATUSES = new Set<ResultStatus>([
  'cancelled',
  'not_enrolled',
  'omitted',
])

function rounded(value: Decimal): string {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()
}

export function resultPercentage(
  result: Pick<StudentResultRow, 'maxMarks' | 'score' | 'status'>,
): string | null {
  if (EXCLUDED_STATUSES.has(result.status) || result.status === 'withheld') {
    return null
  }
  if (result.status === 'absent') return '0'
  if (result.score === null) return null

  const maximum = new Decimal(result.maxMarks)
  if (!maximum.isPositive()) return null
  return rounded(new Decimal(result.score).dividedBy(maximum).times(100))
}

export function filterResultRows(
  rows: readonly StudentResultRow[],
  subjectCode: string | null | undefined,
): StudentResultRow[] {
  const selected = subjectCode?.trim()
  if (!selected || selected.toUpperCase() === 'ALL') return [...rows]
  const normalizedSubject = selected.toUpperCase()
  return rows.filter(
    (row) => row.subjectCode.trim().toUpperCase() === normalizedSubject,
  )
}

export function summarizeResults(
  rows: readonly StudentResultRow[],
): ResultSummary {
  let earnedMarks = new Decimal(0)
  let maximumMarks = new Decimal(0)
  let includedRows = 0
  let pendingRows = 0

  for (const row of rows) {
    if (EXCLUDED_STATUSES.has(row.status)) continue
    maximumMarks = maximumMarks.plus(row.maxMarks)
    includedRows += 1

    if (row.status === 'withheld' || (row.status === 'present' && row.score === null)) {
      pendingRows += 1
      continue
    }
    if (row.status === 'present' && row.score !== null) {
      earnedMarks = earnedMarks.plus(row.score)
    }
  }

  const percentage =
    includedRows === 0 || maximumMarks.isZero() || pendingRows > 0
      ? null
      : rounded(earnedMarks.dividedBy(maximumMarks).times(100))

  return {
    earnedMarks: earnedMarks.toString(),
    maximumMarks: maximumMarks.toString(),
    percentage,
    includedRows,
    pendingRows,
  }
}
