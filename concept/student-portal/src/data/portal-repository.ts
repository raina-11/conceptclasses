import type { ResultStatus, StudentResultRow } from '../domain/qpt/result-summary'

export type PortalRole = 'uploader' | 'publisher' | 'admin'

export type PortalSession = {
  userId: string
  accountLabel: string
}

export type PortalAuthEvent =
  | 'initial'
  | 'signed-in'
  | 'signed-out'
  | 'token-refreshed'
  | 'user-updated'
  | 'other'

export type LinkedStudent = {
  id: string
  fullName: string
  rollNo: string
  batchCode: string
  batchName: string
}

export type StudentQptInsight = {
  assessmentId: string
  qptNumber: number
  displayTitle: string
  testDate: string
  subjectCode: string
  subjectName: string
  maxMarks: string
  studentScore: string | null
  status: ResultStatus
  rank: number | null
  highestScore: string | null
  averageScore: string | null
  participantCount: number
}

export type PortalContext = {
  roles: PortalRole[]
  students: LinkedStudent[]
  mustChangePassword: boolean
}

export type WorkbookSubjectSummary = {
  code: string
  rowCount: number
  maximumMarks: string
}

export type ReviewIssue = {
  code: string
  message: string
  sheet?: string
  row?: number
  column?: number
}

export type WorkbookReview = {
  importId: string
  fileName: string
  state: 'queued' | 'processing' | 'ready' | 'duplicate' | 'rejected'
  format: 'canonical' | 'legacy'
  parserVersion: string
  assessmentCode: string
  displayTitle: string
  qptNumber: number
  testDate: string
  academicYear: string
  batchCode: string
  rowCount: number
  studentCount: number
  subjects: WorkbookSubjectSummary[]
  statusCounts: Record<string, number>
  warnings: ReviewIssue[]
  blockingIssues: ReviewIssue[]
  revisionId: string | null
}

export type QueuedImport = {
  importId: string
  fileName: string
  state: 'uploaded' | 'queued'
}

export type StudentAccountRecord = {
  studentId: string
  fullName: string
  rollNo: string
  batchCode: string
  loginId: string | null
  accountStatus: 'not-provisioned' | 'active' | 'suspended' | 'disabled'
  mustChangePassword: boolean
}

export type IssuedStudentCredential = {
  studentId: string
  loginId: string
  temporaryPassword: string | null
  state: 'provisioned' | 'already-provisioned' | 'reset-required'
}

export type PendingRevision = {
  revisionId: string
  activeRevisionId: string | null
  revisionNumber: number
  isLatestRevision: boolean
  displayTitle: string
  assessmentCode: string
  batchCode: string
  testDate: string
  rowCount: number
  subjects: WorkbookSubjectSummary[]
  statusCounts: Record<string, number>
  warnings: ReviewIssue[]
  uploadedByLabel: string
  stagedAt: string
  canPublish: boolean
}

export interface PortalRepository {
  getSession(): Promise<PortalSession | null>
  onAuthChange(
    listener: (session: PortalSession | null, event: PortalAuthEvent) => void,
  ): () => void
  signIn(loginId: string, password: string): Promise<PortalSession>
  changeInitialPassword(newPassword: string): Promise<void>
  discardLocalSession(): void
  signOut(): Promise<void>
  getPortalContext(): Promise<PortalContext>
  getStudentResults(studentId: string): Promise<StudentResultRow[]>
  getStudentQptInsights(studentId: string): Promise<StudentQptInsight[]>
  getStudentAccounts(): Promise<StudentAccountRecord[]>
  issueStudentCredential(studentId: string): Promise<IssuedStudentCredential>
  resetStudentCredential(studentId: string): Promise<IssuedStudentCredential>
  queueWorkbook(file: File): Promise<QueuedImport>
  getImportReview(importId: string): Promise<WorkbookReview>
  getPendingRevisions(): Promise<PendingRevision[]>
  publishRevision(
    revisionId: string,
    expectedActiveRevisionId: string | null,
  ): Promise<void>
}

export function canUploadResults(roles: readonly PortalRole[]): boolean {
  return roles.includes('uploader') || roles.includes('admin')
}

export function canPublishResults(roles: readonly PortalRole[]): boolean {
  return roles.includes('publisher') || roles.includes('admin')
}
