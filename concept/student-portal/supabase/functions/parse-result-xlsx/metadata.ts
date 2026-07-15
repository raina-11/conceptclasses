import type { PreparedQptImport } from '../../../src/domain/qpt/prepare-import.ts'
import type { WorkbookIssue } from '../../../src/domain/qpt/parse-workbook.ts'

const SAFE_ISSUE_CODE = /^[a-z][a-z0-9_]{0,63}$/
const MAX_RECORDED_ISSUES = 100
const MAX_ISSUE_MESSAGE_LENGTH = 240
const SAFE_SHEET_NAMES = new Set([
  'Instructions',
  'Assessment',
  'Scores',
  'Sheet1',
])

export function safeIssuesForStorage(issues: WorkbookIssue[]) {
  return issues.slice(0, MAX_RECORDED_ISSUES).map((issue) => {
    const message = issue.message
      .replace(/\p{Cc}/gu, ' ')
      .trim()
      .slice(0, MAX_ISSUE_MESSAGE_LENGTH)
    return {
      code: SAFE_ISSUE_CODE.test(issue.code) ? issue.code : 'validation_error',
      message: message || 'The workbook did not pass validation.',
      ...(typeof issue.sheet === 'string' && SAFE_SHEET_NAMES.has(issue.sheet)
        ? { sheet: issue.sheet }
        : {}),
      ...(Number.isSafeInteger(issue.row) && Number(issue.row) > 0
        ? { row: issue.row }
        : {}),
      ...(Number.isSafeInteger(issue.column) && Number(issue.column) > 0
        ? { column: issue.column }
        : {}),
    }
  })
}

export function previewMetadataForStorage(prepared: PreparedQptImport) {
  const assessment = prepared.stagePayload.assessment
  return {
    format: prepared.format,
    parser_version: prepared.parserVersion,
    assessment_code: assessment.assessment_code,
    academic_year: assessment.academic_year,
    qpt_number: assessment.qpt_number,
    batch_code: assessment.batch_code,
    test_date: assessment.test_date,
    display_title: assessment.display_title,
    safe_summary: prepared.safeSummary,
  }
}

export function validationSummaryForStorage(prepared: PreparedQptImport) {
  const subjects = new Map<string, { row_count: number; max_marks: string }>()
  const statusCounts: Record<string, number> = {}

  for (const row of prepared.stagePayload.rows) {
    const subject = subjects.get(row.subject_code)
    if (subject) {
      subject.row_count += 1
    } else {
      subjects.set(row.subject_code, {
        row_count: 1,
        max_marks: row.max_marks,
      })
    }
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
  }

  return {
    review_state: prepared.reviewState,
    student_count: prepared.safeSummary.studentCount,
    row_count: prepared.safeSummary.scoreRowCount,
    subject_count: prepared.safeSummary.subjectCount,
    negative_score_count: prepared.safeSummary.negativeScoreCount,
    absent_count: prepared.safeSummary.absentCount,
    subjects: Array.from(subjects, ([code, subject]) => ({ code, ...subject })),
    status_counts: statusCounts,
    safe_summary: prepared.safeSummary,
    blocking_issue_count: prepared.blockingIssues.length,
    blocking_issues: safeIssuesForStorage(prepared.blockingIssues),
    warning_count: prepared.warnings.length,
    warnings: safeIssuesForStorage(prepared.warnings),
  }
}

export function errorSummaryForStorage(issues: WorkbookIssue[]) {
  return {
    category: 'workbook_validation',
    issue_count: issues.length,
    issues: safeIssuesForStorage(issues),
    truncated: issues.length > MAX_RECORDED_ISSUES,
  }
}
