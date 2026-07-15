import type { StudentResultRow } from '../../src/domain/qpt/result-summary'
import type {
  PendingRevision,
  PortalContext,
  PortalRepository,
  PortalSession,
  StudentQptInsight,
  WorkbookReview,
} from '../../src/data/portal-repository'

export type HarnessState = 'guest' | 'student' | 'admin'

declare global {
  interface Window {
    __PORTAL_E2E_EVENTS__: string[]
  }
}

const SESSION: PortalSession = {
  userId: 'synthetic-user',
  accountLabel: 'T-001',
}

const STUDENT_CONTEXT: PortalContext = {
  roles: [],
  mustChangePassword: false,
  students: [
    {
      id: 'synthetic-student',
      fullName: 'Test Student',
      rollNo: 'T-001',
      batchCode: '10-E',
      batchName: 'Synthetic Class 10 Evening',
    },
  ],
}

const RESULTS: StudentResultRow[] = [
  {
    assessmentId: 'synthetic-assessment-1',
    assessmentCode: 'QPT-1-SYNTHETIC',
    qptNumber: 1,
    displayTitle: 'QPT 1',
    testDate: '2026-07-01',
    subjectCode: 'PHY',
    subjectName: 'Physics',
    maxMarks: '100',
    score: '70',
    status: 'present',
    rank: 2,
  },
  {
    assessmentId: 'synthetic-assessment-2',
    assessmentCode: 'QPT-2-SYNTHETIC',
    qptNumber: 2,
    displayTitle: 'QPT 2',
    testDate: '2026-07-08',
    subjectCode: 'CHEM',
    subjectName: 'Chemistry',
    maxMarks: '80',
    score: null,
    status: 'absent',
    rank: null,
  },
  {
    assessmentId: 'synthetic-assessment-3',
    assessmentCode: 'QPT-3-SYNTHETIC',
    qptNumber: 3,
    displayTitle: 'QPT 3',
    testDate: '2026-07-12',
    subjectCode: 'MATH',
    subjectName: 'Mathematics',
    maxMarks: '50',
    score: '45',
    status: 'present',
    rank: 1,
  },
]

const INSIGHTS: StudentQptInsight[] = [
  {
    assessmentId: 'synthetic-assessment-1',
    qptNumber: 1,
    displayTitle: 'QPT 1',
    testDate: '2026-07-01',
    subjectCode: 'PHY',
    subjectName: 'Physics',
    maxMarks: '100',
    studentScore: '70',
    status: 'present',
    rank: 2,
    highestScore: '96',
    averageScore: '64.5',
    participantCount: 32,
  },
  {
    assessmentId: 'synthetic-assessment-2',
    qptNumber: 2,
    displayTitle: 'QPT 2',
    testDate: '2026-07-08',
    subjectCode: 'CHEM',
    subjectName: 'Chemistry',
    maxMarks: '80',
    studentScore: null,
    status: 'absent',
    rank: null,
    highestScore: '77',
    averageScore: '55.25',
    participantCount: 31,
  },
  {
    assessmentId: 'synthetic-assessment-3',
    qptNumber: 3,
    displayTitle: 'QPT 3',
    testDate: '2026-07-12',
    subjectCode: 'MATH',
    subjectName: 'Mathematics',
    maxMarks: '50',
    studentScore: '45',
    status: 'present',
    rank: 1,
    highestScore: '45',
    averageScore: '34.75',
    participantCount: 30,
  },
]

const REVIEW: WorkbookReview = {
  importId: 'synthetic-import',
  fileName: 'synthetic-qpt.xlsx',
  state: 'ready',
  format: 'canonical',
  parserVersion: 'synthetic-server-v1',
  assessmentCode: 'QPT-5-SYNTHETIC',
  displayTitle: 'QPT 5',
  qptNumber: 5,
  testDate: '2026-07-13',
  academicYear: '2026-27',
  batchCode: '10-E',
  rowCount: 60,
  studentCount: 20,
  subjects: [
    { code: 'PHYSICS', rowCount: 20, maximumMarks: '100' },
    { code: 'CHEMISTRY', rowCount: 20, maximumMarks: '100' },
    { code: 'MATHEMATICS', rowCount: 20, maximumMarks: '100' },
  ],
  statusCounts: { PRESENT: 58, ABSENT: 2 },
  warnings: [],
  blockingIssues: [],
  revisionId: 'synthetic-revision',
}

const PENDING_REVISION: PendingRevision = {
  revisionId: 'synthetic-revision',
  activeRevisionId: null,
  revisionNumber: 1,
  isLatestRevision: true,
  displayTitle: 'QPT 5',
  assessmentCode: 'QPT-5-SYNTHETIC',
  batchCode: '10-E',
  testDate: '2026-07-13',
  rowCount: 60,
  subjects: REVIEW.subjects,
  statusCounts: REVIEW.statusCounts,
  warnings: [],
  uploadedByLabel: 'another authorised staff account',
  stagedAt: '2026-07-13T12:00:00Z',
  canPublish: true,
}

const STUDENT_ACCOUNTS = [
  {
    studentId: 'synthetic-new-student',
    fullName: 'New Test Student',
    rollNo: '0007',
    batchCode: '10-E',
    loginId: null,
    accountStatus: 'not-provisioned' as const,
    mustChangePassword: false,
  },
  {
    studentId: 'synthetic-existing-student',
    fullName: 'Existing Test Student',
    rollNo: '0008',
    batchCode: '10-E',
    loginId: '0008',
    accountStatus: 'active' as const,
    mustChangePassword: false,
  },
]

function track(event: string) {
  window.__PORTAL_E2E_EVENTS__.push(event)
}

export function createSyntheticRepository(state: HarnessState): PortalRepository {
  let session = state === 'guest' ? null : SESSION
  if (session) {
    window.localStorage.setItem(
      `concept-qpt:last-activity:${session.userId}`,
      String(Date.now()),
    )
  }

  return {
    async getSession() {
      return session
    },
    onAuthChange() {
      return () => undefined
    },
    async signIn() {
      track('sign-in')
      session = SESSION
      return SESSION
    },
    async changeInitialPassword() {
      track('initial-password-changed')
    },
    discardLocalSession() {
      track('local-session-discarded')
      session = null
    },
    async signOut() {
      track('sign-out')
      session = null
    },
    async getPortalContext() {
      return state === 'admin'
        ? { roles: ['admin'], students: [], mustChangePassword: false }
        : STUDENT_CONTEXT
    },
    async getStudentResults() {
      return RESULTS
    },
    async getStudentQptInsights() {
      return INSIGHTS
    },
    async getStudentAccounts() {
      return STUDENT_ACCOUNTS
    },
    async issueStudentCredential(studentId) {
      track(`credential-issued:${studentId}`)
      return {
        studentId,
        loginId: studentId === 'synthetic-new-student' ? '0007' : 'T-001',
        temporaryPassword: '=SyntheticPass9',
        state: 'provisioned',
      }
    },
    async resetStudentCredential(studentId) {
      track(`credential-reset:${studentId}`)
      return {
        studentId,
        loginId: studentId === 'synthetic-existing-student' ? '0008' : 'T-001',
        temporaryPassword: 'SyntheticReset9',
        state: 'reset-required',
      }
    },
    async queueWorkbook(file) {
      track('workbook-queued')
      return {
        importId: REVIEW.importId,
        fileName: file.name,
        state: 'queued',
      }
    },
    async getImportReview() {
      return REVIEW
    },
    async getPendingRevisions() {
      return [PENDING_REVISION]
    },
    async publishRevision() {
      track('revision-published')
    },
  }
}
