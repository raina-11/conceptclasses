import JSZip from 'jszip'
import { inspectXlsxPackage } from './inspect-xlsx-package.ts'
import {
  parseLegacyQptWorkbook,
  type ParsedLegacyWorkbook,
} from './parse-legacy-workbook.ts'
import {
  parseQptWorkbook,
  WorkbookValidationError,
  type ParsedQptWorkbook,
  type WorkbookIssue,
} from './parse-workbook.ts'
import { normalizedResultDigest } from './result-digest.ts'

export { WorkbookValidationError } from './parse-workbook.ts'

type StageAssessment = {
  parser_version: string
  template_version: string
  assessment_code: string
  academic_year: string
  qpt_number: number
  batch_code: string
  test_date: string
  display_title: string
  ranking_basis: 'assessment_total' | 'source_rank'
}

type StageRow = {
  roll_no: string
  student_name_for_review: string
  subject_code: string
  subject_name: string
  max_marks: string
  score: string | null
  status: string
  source_rank: number | null
}

export type PreparedQptImport = {
  format: 'canonical' | 'legacy-sheet1'
  parserVersion: string
  rawSha256: string
  normalizedSha256: string
  reviewState: 'READY_FOR_REVIEW' | 'QUARANTINED'
  blockingIssues: WorkbookIssue[]
  warnings: WorkbookIssue[]
  safeSummary: {
    studentCount: number
    scoreRowCount: number
    subjectCount: number
    negativeScoreCount: number
    absentCount: number
  }
  stagePayload: {
    assessment: StageAssessment
    rows: StageRow[]
  }
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digestBytes = new Uint8Array(bytes.byteLength)
  digestBytes.set(bytes)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', digestBytes.buffer)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

async function workbookLayout(
  bytes: Uint8Array,
): Promise<'canonical' | 'legacy-sheet1' | 'unknown'> {
  try {
    const archive = await JSZip.loadAsync(bytes)
    const workbookPart = archive.file('xl/workbook.xml')
    if (!workbookPart) return 'unknown'
    const workbookXml = await workbookPart.async('string')
    const hasSheet = (name: string) =>
      new RegExp(`\\bname=["']${name}["']`).test(workbookXml)
    const isCanonical = ['Instructions', 'Assessment', 'Scores'].every(hasSheet)
    const isLegacy = hasSheet('Sheet1')
    if (isCanonical === isLegacy) return 'unknown'
    return isCanonical ? 'canonical' : 'legacy-sheet1'
  } catch {
    return 'unknown'
  }
}

function canonicalStagePayload(parsed: ParsedQptWorkbook) {
  const subjectCodes = new Set(parsed.rows.map((row) => row.subjectCode))
  return {
    assessment: {
      parser_version: parsed.parserVersion,
      template_version: parsed.parserVersion,
      assessment_code: parsed.assessment.assessmentCode,
      academic_year: parsed.assessment.academicYear,
      qpt_number: parsed.assessment.qptNumber,
      batch_code: parsed.assessment.batchCode,
      test_date: parsed.assessment.testDate,
      display_title: parsed.assessment.displayTitle,
      ranking_basis: 'assessment_total' as const,
    },
    rows: parsed.rows.map((row) => ({
      roll_no: row.rollNo,
      student_name_for_review: row.studentNameForReview,
      subject_code: row.subjectCode,
      subject_name: row.subjectCode,
      max_marks: row.maxMarks,
      score: row.score,
      status: row.status.toLowerCase(),
      source_rank: row.sourceRank,
    })),
    subjectCodes,
  }
}

function legacyStagePayload(parsed: ParsedLegacyWorkbook) {
  const subjectNames = new Map(
    parsed.subjects.map((subject) => [subject.code, subject.name]),
  )
  return {
    assessment: {
      parser_version: parsed.parserVersion,
      template_version: parsed.parserVersion,
      assessment_code: parsed.assessment.assessmentCode,
      academic_year: parsed.assessment.academicYear,
      qpt_number: parsed.assessment.qptNumber,
      batch_code: parsed.assessment.batchCode,
      test_date: parsed.assessment.testDate,
      display_title: parsed.assessment.displayTitle,
      ranking_basis: 'source_rank' as const,
    },
    rows: parsed.rows.map((row) => ({
      roll_no: row.rollNo,
      student_name_for_review: row.studentNameForReview,
      subject_code: row.subjectCode,
      subject_name: subjectNames.get(row.subjectCode) ?? row.subjectCode,
      max_marks: row.maxMarks,
      score: row.score,
      status: row.status.toLowerCase(),
      source_rank: row.sourceRank,
    })),
    subjectCodes: new Set(parsed.subjects.map((subject) => subject.code)),
  }
}

function safeSummary(rows: StageRow[], subjectCodes: Set<string>) {
  return {
    studentCount: new Set(rows.map((row) => row.roll_no)).size,
    scoreRowCount: rows.length,
    subjectCount: subjectCodes.size,
    negativeScoreCount: rows.filter(
      (row) => row.score !== null && Number(row.score) < 0,
    ).length,
    absentCount: rows.filter((row) => row.status === 'absent').length,
  }
}

export async function prepareQptImport(
  bytes: Uint8Array,
  options: { sourceFilename: string },
): Promise<PreparedQptImport> {
  const packageIssues = await inspectXlsxPackage(bytes)
  if (packageIssues.length > 0) {
    throw new WorkbookValidationError(packageIssues)
  }

  const layout = await workbookLayout(bytes)
  if (layout === 'unknown') {
    throw new WorkbookValidationError([
      {
        code: 'unknown_workbook_layout',
        message: 'Use either the official template or a supported legacy Sheet1 export.',
      },
    ])
  }

  const rawSha256 = await sha256(bytes)
  if (layout === 'canonical') {
    const parsed = await parseQptWorkbook(bytes)
    const stage = canonicalStagePayload(parsed)
    return {
      format: 'canonical',
      parserVersion: parsed.parserVersion,
      rawSha256,
      normalizedSha256: await normalizedResultDigest(parsed),
      reviewState: 'READY_FOR_REVIEW',
      blockingIssues: [],
      warnings: parsed.warnings,
      safeSummary: safeSummary(stage.rows, stage.subjectCodes),
      stagePayload: { assessment: stage.assessment, rows: stage.rows },
    }
  }

  const parsed = await parseLegacyQptWorkbook(bytes, options)
  const stage = legacyStagePayload(parsed)
  return {
    format: 'legacy-sheet1',
    parserVersion: parsed.parserVersion,
    rawSha256,
    normalizedSha256: await normalizedResultDigest(parsed),
    reviewState: parsed.reviewState,
    blockingIssues: parsed.blockingIssues,
    warnings: parsed.warnings,
    safeSummary: safeSummary(stage.rows, stage.subjectCodes),
    stagePayload: { assessment: stage.assessment, rows: stage.rows },
  }
}
