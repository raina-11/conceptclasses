import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ResultStatus, StudentResultRow } from '../domain/qpt/result-summary'
import type { Database } from '../lib/database.types'
import { getOrCreateHotClient } from '../lib/hot-client'
import { authEmailForLoginId, visibleLoginId } from '../security/student-login'
import type {
  LinkedStudent,
  IssuedStudentCredential,
  PendingRevision,
  PortalContext,
  PortalAuthEvent,
  PortalRepository,
  PortalRole,
  PortalSession,
  QueuedImport,
  ReviewIssue,
  StudentAccountRecord,
  StudentQptInsight,
  WorkbookReview,
  WorkbookSubjectSummary,
} from './portal-repository'

type JsonRecord = Record<string, unknown>

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_PUBLIC_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined
const AUTH_STORAGE_KEY = 'concept-qpt:supabase-auth'

function record(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function records(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.map(record).filter((item): item is JsonRecord => item !== null)
  }
  const item = record(value)
  return item ? [item] : []
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : null
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function portalSession(session: {
  user: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  }
} | null): PortalSession | null {
  if (!session) return null
  return {
    userId: session.user.id,
    accountLabel: visibleLoginId(
      session.user.email,
      session.user.user_metadata?.login_id,
    ),
  }
}

function portalAuthEvent(event: string): PortalAuthEvent {
  if (event === 'INITIAL_SESSION') return 'initial'
  if (event === 'SIGNED_IN') return 'signed-in'
  if (event === 'SIGNED_OUT') return 'signed-out'
  if (event === 'TOKEN_REFRESHED') return 'token-refreshed'
  if (event === 'USER_UPDATED') return 'user-updated'
  return 'other'
}

function checkedRole(value: unknown): PortalRole | null {
  return value === 'uploader' || value === 'publisher' || value === 'admin'
    ? value
    : null
}

function linkedStudent(value: JsonRecord): LinkedStudent | null {
  const id = text(value.student_id ?? value.id)
  const rollNo = text(value.roll_no)
  if (!id || !rollNo) return null
  const batchCode = text(value.batch_code)
  return {
    id,
    fullName: text(value.full_name ?? value.student_name, `Roll ${rollNo}`),
    rollNo,
    batchCode,
    batchName: text(value.batch_name ?? value.batch_display_name, batchCode),
  }
}

function studentAccount(value: JsonRecord): StudentAccountRecord | null {
  const studentId = text(value.student_id ?? value.studentId)
  const rollNo = text(value.roll_no ?? value.rollNo)
  if (!studentId || !rollNo) return null
  const rawStatus = text(value.account_status ?? value.accountStatus)
  const accountStatus: StudentAccountRecord['accountStatus'] =
    rawStatus === 'active' || rawStatus === 'suspended' || rawStatus === 'disabled'
      ? rawStatus
      : 'not-provisioned'
  const loginId = text(value.login_id ?? value.loginId) || null
  return {
    studentId,
    fullName: text(value.full_name ?? value.fullName, `Roll ${rollNo}`),
    rollNo,
    batchCode: text(value.batch_code ?? value.batchCode),
    loginId,
    accountStatus,
    mustChangePassword:
      value.must_change_password === true || value.mustChangePassword === true,
  }
}

function issuedCredential(value: unknown): IssuedStudentCredential {
  const payload = record(value)
  if (!payload) throw new Error('The account service returned an invalid response.')
  const studentId = text(payload.studentId ?? payload.student_id)
  const loginId = text(payload.loginId ?? payload.login_id)
  const rawState = text(payload.state)
  if (!studentId || !loginId) throw new Error('The account service returned an invalid response.')
  if (
    rawState !== 'provisioned' &&
    rawState !== 'already-provisioned' &&
    rawState !== 'reset-required'
  ) {
    throw new Error('The account service returned an invalid response.')
  }
  return {
    studentId,
    loginId,
    temporaryPassword: text(payload.temporaryPassword ?? payload.temporary_password) || null,
    state: rawState,
  }
}

function resultStatus(value: unknown): ResultStatus {
  if (
    value === 'present' ||
    value === 'absent' ||
    value === 'withheld' ||
    value === 'cancelled' ||
    value === 'not_enrolled' ||
    value === 'omitted'
  ) {
    return value
  }
  throw new Error('The server returned an unsupported result status.')
}

function resultRow(value: JsonRecord): StudentResultRow {
  const rankValue = value.rank
  return {
    assessmentId: text(value.assessment_id),
    assessmentCode: text(value.assessment_code),
    qptNumber: numberValue(value.qpt_number),
    displayTitle: text(value.display_title),
    testDate: text(value.test_date),
    subjectCode: text(value.subject_code),
    subjectName: text(value.subject_name, text(value.subject_code)),
    maxMarks: text(value.max_marks),
    score: value.score === null || value.score === undefined ? null : text(value.score),
    status: resultStatus(value.status),
    rank: rankValue === null || rankValue === undefined ? null : numberValue(rankValue),
  }
}

function qptInsight(value: JsonRecord): StudentQptInsight {
  const subjectCode = text(value.subject_code)
  return {
    assessmentId: text(value.assessment_id),
    qptNumber: numberValue(value.qpt_number),
    displayTitle: text(value.display_title),
    testDate: text(value.test_date),
    subjectCode,
    subjectName: text(value.subject_name, subjectCode),
    maxMarks: text(value.max_marks),
    studentScore: nullableText(value.student_score),
    status: resultStatus(value.status),
    rank: nullableNumber(value.rank),
    highestScore: nullableText(value.cohort_highest_score),
    averageScore: nullableText(value.cohort_average_score),
    participantCount: numberValue(value.participant_count),
  }
}

function reviewIssue(value: unknown): ReviewIssue | null {
  if (typeof value === 'string') return { code: 'review_issue', message: value }
  const item = record(value)
  if (!item) return null
  const message = text(item.message)
  if (!message) return null
  return {
    code: text(item.code, 'review_issue'),
    message,
    sheet: text(item.sheet) || undefined,
    row: item.row === null || item.row === undefined ? undefined : numberValue(item.row),
    column:
      item.column === null || item.column === undefined
        ? undefined
        : numberValue(item.column),
  }
}

function reviewIssues(value: unknown): ReviewIssue[] {
  const wrapper = record(value)
  if (wrapper && 'issues' in wrapper) return reviewIssues(wrapper.issues)
  const source = Array.isArray(value) ? value : value ? [value] : []
  return source.map(reviewIssue).filter((item): item is ReviewIssue => item !== null)
}

function isAlreadyUploadedError(value: unknown): boolean {
  const item = record(value)
  const status = text(item?.statusCode ?? item?.status)
  const message = text(item?.message).toLowerCase()
  return status === '409' || message.includes('already exists') || message.includes('duplicate')
}

function subjectSummaries(value: unknown): WorkbookSubjectSummary[] {
  return records(value)
    .map((subject) => ({
      code: text(subject.code ?? subject.subject_code),
      rowCount: numberValue(subject.row_count ?? subject.rows),
      maximumMarks: text(subject.maximum_marks ?? subject.max_marks),
    }))
    .filter((subject) => Boolean(subject.code))
}

function importState(value: unknown): WorkbookReview['state'] {
  if (value === 'quarantined' || value === 'failed') return 'rejected'
  if (value === 'parsing') return 'processing'
  if (value === 'duplicate') return 'duplicate'
  if (value === 'parsed' || value === 'staged' || value === 'published') {
    return 'ready'
  }
  return 'queued'
}

const TERMINAL_IMPORT_STATES = new Set([
  'parsed',
  'duplicate',
  'quarantined',
  'failed',
  'staged',
  'published',
])

type ImportRetryState = 'unavailable' | 'resumable' | 'terminal'

async function importRetryState(
  client: SupabaseClient<Database>,
  importId: string,
): Promise<ImportRetryState> {
  const { data, error } = await client.schema('api').rpc('import_review', {
    p_import_id: importId,
  })
  if (error) return 'unavailable'
  const status = text(records(data)[0]?.status)
  if (TERMINAL_IMPORT_STATES.has(status)) return 'terminal'
  if (status === 'uploaded' || status === 'parsing') return 'resumable'
  return 'unavailable'
}

function workbookReview(value: JsonRecord): WorkbookReview {
  const preview = record(value.preview_metadata) ?? {}
  const validation = record(value.validation_summary) ?? {}
  const assessment = record(preview.assessment) ?? preview
  const blockingIssues = [
    ...reviewIssues(value.error_summary),
    ...reviewIssues(validation.blocking_issues ?? validation.errors),
  ]
  const status = text(value.status)
  const requiresReupload = value.requires_corrected_reupload === true
  if (requiresReupload && blockingIssues.length === 0) {
    blockingIssues.push({
      code: 'corrected_reupload_required',
      message: 'Correct the source workbook and upload it again.',
    })
  }
  const parserVersion = text(value.parser_version)
  const statusCountsRecord = record(validation.status_counts) ?? {}
  const statusCounts = Object.fromEntries(
    Object.entries(statusCountsRecord).map(([key, count]) => [key, numberValue(count)]),
  )

  return {
    importId: text(value.import_id),
    fileName: text(value.original_filename),
    state: importState(status),
    format: parserVersion.toLowerCase().includes('legacy') ? 'legacy' : 'canonical',
    parserVersion,
    assessmentCode: text(assessment.assessment_code),
    displayTitle: text(assessment.display_title, text(value.original_filename)),
    qptNumber: numberValue(assessment.qpt_number),
    testDate: text(assessment.test_date),
    academicYear: text(assessment.academic_year),
    batchCode: text(assessment.batch_code),
    rowCount: numberValue(value.row_count ?? validation.row_count),
    studentCount: numberValue(validation.student_count ?? preview.student_count),
    subjects: subjectSummaries(validation.subjects ?? preview.subjects),
    statusCounts,
    warnings: reviewIssues(validation.warnings),
    blockingIssues,
    revisionId: text(value.revision_id) || null,
  }
}

function pendingRevision(value: JsonRecord): PendingRevision | null {
  const revisionId = text(value.revision_id)
  if (!revisionId) return null
  const statusCountsRecord = record(value.status_counts) ?? {}
  return {
    revisionId,
    activeRevisionId: text(value.active_revision_id) || null,
    revisionNumber: numberValue(value.revision_number),
    isLatestRevision: value.is_latest_revision === true,
    displayTitle: text(value.display_title),
    assessmentCode: text(value.assessment_code),
    batchCode: text(value.batch_code),
    testDate: text(value.test_date),
    rowCount: numberValue(value.row_count),
    subjects: subjectSummaries(value.subject_summaries),
    statusCounts: Object.fromEntries(
      Object.entries(statusCountsRecord).map(([key, count]) => [key, numberValue(count)]),
    ),
    warnings: reviewIssues(value.warnings),
    uploadedByLabel: 'the authorised admin workflow',
    stagedAt: text(value.staged_at),
    canPublish: value.can_publish !== false,
  }
}

class SupabasePortalRepository implements PortalRepository {
  private readonly importRequestIds = new WeakMap<File, string>()

  constructor(private readonly client: SupabaseClient<Database> | null) {}

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error('The portal is not connected yet. Add the public Supabase configuration and redeploy.')
    }
    return this.client
  }

  async getSession(): Promise<PortalSession | null> {
    if (!this.client) return null
    const { data, error } = await this.client.auth.getSession()
    if (error) throw error
    return portalSession(data.session)
  }

  onAuthChange(
    listener: (session: PortalSession | null, event: PortalAuthEvent) => void,
  ): () => void {
    if (!this.client) return () => undefined
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      listener(portalSession(session), portalAuthEvent(event))
    })
    return () => data.subscription.unsubscribe()
  }

  async signIn(loginId: string, password: string): Promise<PortalSession> {
    const email = authEmailForLoginId(loginId)
    const { data, error } = await this.requireClient().auth.signInWithPassword({ email, password })
    if (error) throw error
    const session = portalSession(data.session)
    if (!session) throw new Error('The sign-in session was not created.')
    return session
  }

  async changeInitialPassword(newPassword: string): Promise<void> {
    const { error } = await this.requireClient().functions.invoke('student-account', {
      body: { action: 'change-initial-password', newPassword },
    })
    if (error) throw error
  }

  discardLocalSession(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.localStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`)
  }

  async signOut(): Promise<void> {
    const { error } = await this.requireClient().auth.signOut({ scope: 'local' })
    if (error) throw error
  }

  async getPortalContext(): Promise<PortalContext> {
    const client = this.requireClient()
    const [contextResponse, studentsResponse] = await Promise.all([
      client.schema('api').rpc('my_portal_context'),
      client.schema('api').rpc('my_students'),
    ])
    if (contextResponse.error) throw contextResponse.error
    if (studentsResponse.error) throw studentsResponse.error

    const contextRows = records(contextResponse.data)
    const roles = new Set<PortalRole>()
    const studentValues: JsonRecord[] = [...records(studentsResponse.data)]
    let mustChangePassword = false
    contextRows.forEach((contextRow) => {
      if (contextRow.must_change_password === true || contextRow.mustChangePassword === true) {
        mustChangePassword = true
      }
      const directRole = checkedRole(contextRow.role)
      if (directRole) roles.add(directRole)
      if (Array.isArray(contextRow.roles)) {
        contextRow.roles.forEach((role) => {
          const checked = checkedRole(role)
          if (checked) roles.add(checked)
        })
      }
      if (Array.isArray(contextRow.students)) studentValues.push(...records(contextRow.students))
    })

    const studentMap = new Map<string, LinkedStudent>()
    studentValues.forEach((studentValue) => {
      const student = linkedStudent(studentValue)
      if (student) studentMap.set(student.id, student)
    })
    return {
      roles: [...roles],
      students: [...studentMap.values()],
      mustChangePassword,
    }
  }

  async getStudentResults(studentId: string): Promise<StudentResultRow[]> {
    const { data, error } = await this.requireClient().schema('api').rpc('student_results', {
      p_student_id: studentId,
    })
    if (error) throw error
    return records(data).map(resultRow)
  }

  async getStudentQptInsights(studentId: string): Promise<StudentQptInsight[]> {
    // Keep this local response shape until the generated Supabase types include
    // the newly deployed RPC; the public repository contract remains typed.
    const api = this.requireClient().schema('api') as unknown as {
      rpc: (
        name: 'student_result_insights',
        args: { p_student_id: string },
      ) => Promise<{ data: unknown; error: unknown }>
    }
    const { data, error } = await api.rpc('student_result_insights', {
      p_student_id: studentId,
    })
    if (error) throw error
    return records(data).map(qptInsight)
  }

  async getStudentAccounts(): Promise<StudentAccountRecord[]> {
    const { data, error } = await this.requireClient().functions.invoke('student-account', {
      body: { action: 'list' },
    })
    if (error) throw error
    const wrapper = record(data)
    const values = records(wrapper?.accounts ?? data)
    return values
      .map(studentAccount)
      .filter((account): account is StudentAccountRecord => account !== null)
  }

  async issueStudentCredential(studentId: string): Promise<IssuedStudentCredential> {
    const { data, error } = await this.requireClient().functions.invoke('student-account', {
      body: { action: 'provision', studentId },
    })
    if (error) throw error
    return issuedCredential(data)
  }

  async resetStudentCredential(studentId: string): Promise<IssuedStudentCredential> {
    const { data, error } = await this.requireClient().functions.invoke('student-account', {
      body: { action: 'reset', studentId },
    })
    if (error) throw error
    return issuedCredential(data)
  }

  async queueWorkbook(file: File): Promise<QueuedImport> {
    const client = this.requireClient()
    const clientRequestId = this.importRequestIds.get(file) ?? crypto.randomUUID()
    this.importRequestIds.set(file, clientRequestId)
    const begin = await client.schema('api').rpc('begin_import', {
      p_client_request_id: clientRequestId,
      p_original_filename: file.name,
      p_byte_size: file.size,
    })
    if (begin.error) throw begin.error
    const importTarget = records(begin.data)[0]
    if (!importTarget) throw new Error('The server did not create an upload target.')
    const importId = text(importTarget.import_id)
    const bucket = text(importTarget.storage_bucket)
    const path = text(importTarget.storage_path)
    if (!importId || !bucket || !path) throw new Error('The server returned an invalid upload target.')

    const upload = await client.storage.from(bucket).upload(path, file, {
      cacheControl: '0',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    })
    if (upload.error && !isAlreadyUploadedError(upload.error)) {
      // A response can be lost after the server committed and deleted the raw
      // object. The same client request then resolves to the terminal import,
      // whose path is intentionally no longer writable. Resume review instead
      // of presenting a false upload failure.
      const retryState = await importRetryState(client, importId)
      if (retryState === 'terminal') {
        return { importId, fileName: file.name, state: 'queued' }
      }
      // An origin/network failure can happen after the immutable object was
      // uploaded and confirmed but before the Edge Function claimed it. In
      // that state Storage correctly rejects the duplicate insert with RLS;
      // continue the idempotent confirmation/function path instead.
      if (retryState !== 'resumable') throw upload.error
    }

    const confirmation = await client.schema('api').rpc('confirm_import_upload', {
      p_import_id: importId,
    })
    if (confirmation.error) throw confirmation.error

    const parsing = await client.functions.invoke('parse-result-xlsx', {
      body: { importId },
    })
    if (parsing.error) throw parsing.error
    return { importId, fileName: file.name, state: 'queued' }
  }

  async getImportReview(importId: string): Promise<WorkbookReview> {
    const { data, error } = await this.requireClient().schema('api').rpc('import_review', {
      p_import_id: importId,
    })
    if (error) throw error
    const item = records(data)[0]
    if (!item) throw new Error('The import review was not found.')
    return workbookReview(item)
  }

  async getPendingRevisions(): Promise<PendingRevision[]> {
    const { data, error } = await this.requireClient().schema('api').rpc('pending_revisions')
    if (error) throw error
    return records(data)
      .map(pendingRevision)
      .filter((item): item is PendingRevision => item !== null)
  }

  async publishRevision(
    revisionId: string,
    expectedActiveRevisionId: string | null,
  ): Promise<void> {
    const { error } = await this.requireClient().schema('api').rpc('publish_revision', {
      p_revision_id: revisionId,
      p_expected_active_revision_id: expectedActiveRevisionId,
    })
    if (error) throw error
  }
}

export function createPortalRepository(
  client: SupabaseClient<Database> | null,
): PortalRepository {
  return new SupabasePortalRepository(client)
}

const client =
  SUPABASE_URL && SUPABASE_PUBLIC_KEY
    ? getOrCreateHotClient(
        import.meta.hot?.data as Record<string, unknown> | undefined,
        `${SUPABASE_URL}\n${SUPABASE_PUBLIC_KEY}\n${AUTH_STORAGE_KEY}`,
        () => createClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
          auth: {
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true,
            storageKey: AUTH_STORAGE_KEY,
          },
        }),
      )
    : null

export const browserPortalRepository: PortalRepository = createPortalRepository(client)
