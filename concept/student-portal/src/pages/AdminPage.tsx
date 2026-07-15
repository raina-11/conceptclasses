import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  downloadTemporaryCredentialWorkbook,
  type TemporaryCredentialAction,
  type TemporaryCredentialExportRow,
} from '../admin/temporary-credential-workbook'
import {
  CREDENTIAL_BATCH_CONCURRENCY,
  mapWithConcurrency,
  validateCredentialBatchTargets,
} from '../admin/concurrent-batch'
import { PageStatus } from '../components/PageStatus'
import type {
  IssuedStudentCredential,
  PendingRevision,
  PortalRepository,
  PortalRole,
  QueuedImport,
  ReviewIssue,
  StudentAccountRecord,
  WorkbookReview,
} from '../data/portal-repository'
import { canPublishResults, canUploadResults } from '../data/portal-repository'

type AdminPageProps = {
  repository: PortalRepository
  roles: PortalRole[]
  onCredentialProtectionChange?: (state: CredentialProtectionState) => void
}

export type CredentialProtectionState = 'clear' | 'busy' | 'ready'

const REVIEW_POLL_INTERVAL_MS = 2_000
const REVIEW_MAX_AUTO_RETRIES = 3
type AdminSection = 'workbooks' | 'student-access'

type CredentialBatchProgress = {
  completed: number
  total: number
}

type CredentialBatchFailure = {
  studentId: string
  studentName: string
  rollNumber: string
  batchCode: string
  reason: string
}

function credentialBatchFailureReason(reason: unknown): string {
  if (reason instanceof Error) {
    if (reason.message === 'The credential response did not match the requested student.') {
      return 'Student response mismatch'
    }
    if (reason.message === 'The one-time credential was not returned.') {
      return 'Temporary password missing'
    }
  }
  return 'Account update failed'
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'The operation could not be completed. Please try again.'
}

function issueLocation(issue: ReviewIssue): string {
  const parts = [issue.sheet, issue.row ? `row ${issue.row}` : null].filter(Boolean)
  return parts.length > 0 ? ` (${parts.join(', ')})` : ''
}

function displayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function displayStatus(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ReviewCard({ review }: { review: WorkbookReview }) {
  const accepted = review.state === 'ready' && review.blockingIssues.length === 0
  const duplicate = review.state === 'duplicate'
  const stateClass = accepted
    ? 'review-ready'
    : duplicate
      ? 'review-duplicate'
      : 'review-blocked'
  const stateLabel = accepted
    ? 'Server validated'
    : duplicate
      ? 'Already imported'
      : 'Needs correction'
  return (
    <section className="review-card" aria-labelledby="review-title">
      <div className="review-header">
        <div>
          <p className="eyebrow">Server validation review</p>
          <h3 id="review-title">{review.displayTitle}</h3>
          <p>{review.assessmentCode}</p>
        </div>
        <span className={`review-state ${stateClass}`}>
          {stateLabel}
        </span>
      </div>

      <dl className="review-metrics">
        <div><dt>Batch</dt><dd>{review.batchCode}</dd></div>
        <div><dt>Test date</dt><dd>{displayDate(review.testDate)}</dd></div>
        <div><dt>Students</dt><dd>{review.studentCount}</dd></div>
        <div><dt>Rows</dt><dd>{review.rowCount}</dd></div>
      </dl>
      <p className="review-row-count">{review.rowCount} score rows</p>

      <div className="subject-summary" aria-label="Workbook subject summary">
        {review.subjects.map((subject) => (
          <span key={subject.code}>
            <strong>{subject.code}</strong>
            {subject.rowCount} rows · max {subject.maximumMarks}
          </span>
        ))}
      </div>

      {duplicate && (
        <p className="alert alert-warning" role="status">
          These normalized results already exist. No new revision was created or queued for publication.
        </p>
      )}

      {review.warnings.length > 0 && (
        <div className="alert alert-warning">
          <strong>{review.warnings.length} review warning{review.warnings.length === 1 ? '' : 's'}</strong>
          <ul>
            {review.warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{warning.message}{issueLocation(warning)}</li>
            ))}
          </ul>
        </div>
      )}
      {review.blockingIssues.length > 0 && (
        <div className="alert alert-error" role="alert">
          <strong>Correct these issues before upload</strong>
          <ul>
            {review.blockingIssues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}{issueLocation(issue)}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export function AdminPage({
  repository,
  roles,
  onCredentialProtectionChange,
}: AdminPageProps) {
  const canUpload = canUploadResults(roles)
  const canPublish = canPublishResults(roles)
  const isUnifiedAdmin = roles.includes('admin')
  const [file, setFile] = useState<File | null>(null)
  const [review, setReview] = useState<WorkbookReview | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewReload, setReviewReload] = useState(0)
  const [queueState, setQueueState] = useState<'idle' | 'uploading'>('idle')
  const [queueError, setQueueError] = useState<string | null>(null)
  const [queuedImport, setQueuedImport] = useState<QueuedImport | null>(null)
  const [pending, setPending] = useState<PendingRevision[]>([])
  const [pendingState, setPendingState] = useState<'loading' | 'ready' | 'error'>(canPublish ? 'loading' : 'ready')
  const [pendingReload, setPendingReload] = useState(0)
  const [confirmRevision, setConfirmRevision] = useState<PendingRevision | null>(null)
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishedMessage, setPublishedMessage] = useState<string | null>(null)
  const [studentAccounts, setStudentAccounts] = useState<StudentAccountRecord[]>([])
  const [accountState, setAccountState] = useState<'loading' | 'ready' | 'error'>(
    isUnifiedAdmin ? 'loading' : 'ready',
  )
  const [accountReload, setAccountReload] = useState(0)
  const [accountActionStudentId, setAccountActionStudentId] = useState<string | null>(null)
  const [credential, setCredential] = useState<IssuedStudentCredential | null>(null)
  const [credentialStudentName, setCredentialStudentName] = useState('')
  const credentialPanelRef = useRef<HTMLDivElement>(null)
  const [accountActionError, setAccountActionError] = useState<string | null>(null)
  const [resetCandidate, setResetCandidate] = useState<StudentAccountRecord | null>(null)
  const [issuedCredentials, setIssuedCredentials] = useState<TemporaryCredentialExportRow[]>([])
  const [batchProgress, setBatchProgress] = useState<CredentialBatchProgress | null>(null)
  const [batchFailures, setBatchFailures] = useState<CredentialBatchFailure[]>([])
  const [batchProgressAnnouncement, setBatchProgressAnnouncement] = useState('')
  const [lastCredentialBatchTotal, setLastCredentialBatchTotal] = useState<number | null>(null)
  const [confirmCompleteCredentialFile, setConfirmCompleteCredentialFile] = useState(false)
  const [completeCredentialAcknowledged, setCompleteCredentialAcknowledged] = useState(false)
  const [credentialDownloadState, setCredentialDownloadState] = useState<'idle' | 'preparing'>('idle')
  const [credentialDownloadError, setCredentialDownloadError] = useState<string | null>(null)
  const [credentialDownloadStarted, setCredentialDownloadStarted] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>('workbooks')
  const workbooksTabRef = useRef<HTMLButtonElement>(null)
  const studentAccessTabRef = useRef<HTMLButtonElement>(null)
  const completeCredentialTriggerRef = useRef<HTMLButtonElement>(null)
  const completeCredentialConfirmationRef = useRef<HTMLDivElement>(null)
  const batchRunActiveRef = useRef(false)

  const eligibleCredentialAccounts = studentAccounts.filter(
    (account) => account.accountStatus === 'active'
      || (account.accountStatus === 'not-provisioned' && !account.loginId),
  )
  const existingCredentialAccountCount = eligibleCredentialAccounts.filter(
    (account) => Boolean(account.loginId),
  ).length
  const excludedCredentialAccountCount = studentAccounts.length - eligibleCredentialAccounts.length
  const credentialProtectionState: CredentialProtectionState = batchProgress || accountActionStudentId
    ? 'busy'
    : issuedCredentials.length > 0 || Boolean(credential?.temporaryPassword)
      ? 'ready'
      : 'clear'

  useEffect(() => {
    if (activeSection !== 'student-access' || !credential?.temporaryPassword) return
    const panel = credentialPanelRef.current
    if (!panel) return
    panel.focus({ preventScroll: true })
    panel.scrollIntoView?.({ block: 'center' })
  }, [activeSection, credential])

  useEffect(() => {
    if (
      !batchProgress
      && !accountActionStudentId
      && issuedCredentials.length === 0
      && !credential?.temporaryPassword
    ) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [accountActionStudentId, batchProgress, credential?.temporaryPassword, issuedCredentials.length])

  useLayoutEffect(() => {
    onCredentialProtectionChange?.(credentialProtectionState)
  }, [credentialProtectionState, onCredentialProtectionChange])

  useEffect(() => () => {
    onCredentialProtectionChange?.('clear')
  }, [onCredentialProtectionChange])

  useEffect(() => {
    if (!confirmCompleteCredentialFile) return
    completeCredentialConfirmationRef.current?.focus({ preventScroll: true })
  }, [confirmCompleteCredentialFile])

  useEffect(() => {
    if (!queuedImport) return
    const activeImport = queuedImport
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let consecutiveFailures = 0

    async function pollReview() {
      try {
        const nextReview = await repository.getImportReview(activeImport.importId)
        if (!active) return
        consecutiveFailures = 0
        setReview(nextReview)
        setReviewError(null)
        if (nextReview.state === 'queued' || nextReview.state === 'processing') {
          timer = setTimeout(() => void pollReview(), REVIEW_POLL_INTERVAL_MS)
        } else if (nextReview.state === 'ready' && canPublish) {
          setPendingReload((value) => value + 1)
        }
      } catch {
        if (!active) return
        consecutiveFailures += 1
        const willRetry = consecutiveFailures <= REVIEW_MAX_AUTO_RETRIES
        setReviewError(
          willRetry
            ? 'The latest server validation status could not be loaded. Retrying automatically.'
            : 'The latest server validation status could not be loaded. Retry when the connection is available.',
        )
        if (willRetry) {
          timer = setTimeout(
            () => void pollReview(),
            REVIEW_POLL_INTERVAL_MS * consecutiveFailures,
          )
        }
      }
    }

    void pollReview()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [canPublish, queuedImport, repository, reviewReload])

  useEffect(() => {
    if (!canPublish) return
    let active = true
    setPendingState('loading')
    void repository
      .getPendingRevisions()
      .then((revisions) => {
        if (active) {
          setPending(revisions)
          setPendingState('ready')
        }
      })
      .catch(() => {
        if (active) setPendingState('error')
      })
    return () => {
      active = false
    }
  }, [canPublish, pendingReload, repository])

  useEffect(() => {
    if (!isUnifiedAdmin) return
    let active = true
    setAccountState('loading')
    void repository
      .getStudentAccounts()
      .then((accounts) => {
        if (active) {
          setStudentAccounts(accounts)
          setAccountState('ready')
        }
      })
      .catch(() => {
        if (active) setAccountState('error')
      })
    return () => {
      active = false
    }
  }, [accountReload, isUnifiedAdmin, repository])

  if (!canUpload && !canPublish) {
    return (
      <main className="page-main" id="main-content" tabIndex={-1}>
        <PageStatus
          title="Admin access required"
          message="This account can view student results but cannot upload or publish them."
          kind="error"
        />
      </main>
    )
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setReview(null)
    setQueuedImport(null)
    setQueueError(null)
    setFileError(null)
    setReviewError(null)
    if (!nextFile) return

    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      setFileError('Choose an Excel workbook with the .xlsx extension.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setFileError('The workbook is larger than the 10 MB upload limit.')
    }
  }

  async function queueForValidation() {
    if (!file || fileError) return
    setQueueState('uploading')
    setQueueError(null)
    try {
      setQueuedImport(await repository.queueWorkbook(file))
    } catch (error) {
      setQueueError(errorMessage(error))
    } finally {
      setQueueState('idle')
    }
  }

  async function publish() {
    if (!confirmRevision) return
    if (confirmRevision.warnings.length > 0 && !warningsAcknowledged) return
    setPublishing(true)
    setPublishError(null)
    setPublishedMessage(null)
    try {
      await repository.publishRevision(
        confirmRevision.revisionId,
        confirmRevision.activeRevisionId,
      )
      setPending((current) => current.filter((item) => item.revisionId !== confirmRevision.revisionId))
      setPublishedMessage(`${confirmRevision.displayTitle} was published.`)
      setConfirmRevision(null)
      setWarningsAcknowledged(false)
      setPendingReload((value) => value + 1)
    } catch (error) {
      setPublishError(errorMessage(error))
    } finally {
      setPublishing(false)
    }
  }

  function applyCredentialToAccount(nextCredential: IssuedStudentCredential) {
    setStudentAccounts((accounts) => accounts.map((account) =>
      account.studentId === nextCredential.studentId
        ? {
            ...account,
            loginId: nextCredential.loginId,
            accountStatus: 'active',
            mustChangePassword: nextCredential.state !== 'already-provisioned',
          }
        : account,
    ))
  }

  function exportRowForCredential(
    account: StudentAccountRecord,
    nextCredential: IssuedStudentCredential,
    action: TemporaryCredentialAction,
  ): TemporaryCredentialExportRow | null {
    if (!nextCredential.temporaryPassword) return null
    return {
      studentName: account.fullName,
      rollNumber: account.rollNo,
      batch: account.batchCode,
      loginId: nextCredential.loginId,
      temporaryPassword: nextCredential.temporaryPassword,
      action,
      issuedAt: new Date().toISOString(),
    }
  }

  function rememberCredential(row: TemporaryCredentialExportRow | null) {
    if (!row) return
    setIssuedCredentials((current) => [
      ...current.filter((item) => item.loginId !== row.loginId),
      row,
    ])
    setCredentialDownloadStarted(false)
    setCredentialDownloadError(null)
  }

  async function provisionAccount(account: StudentAccountRecord) {
    setAccountActionStudentId(account.studentId)
    setAccountActionError(null)
    setCredential(null)
    try {
      const nextCredential = await repository.issueStudentCredential(account.studentId)
      if (nextCredential.studentId !== account.studentId) {
        throw new Error('The credential response did not match the requested student.')
      }
      applyCredentialToAccount(nextCredential)
      const row = exportRowForCredential(account, nextCredential, 'created')
      rememberCredential(row)
      if (row) {
        setBatchFailures((current) => current.filter((failure) => failure.studentId !== account.studentId))
      }
      setCredentialStudentName(account.fullName)
      setCredential(nextCredential)
    } catch {
      setAccountActionError('The student login could not be created. Please try again.')
    } finally {
      setAccountActionStudentId(null)
    }
  }

  async function resetAccount(account: StudentAccountRecord) {
    setAccountActionStudentId(account.studentId)
    setAccountActionError(null)
    setCredential(null)
    try {
      const nextCredential = await repository.resetStudentCredential(account.studentId)
      if (nextCredential.studentId !== account.studentId) {
        throw new Error('The credential response did not match the requested student.')
      }
      applyCredentialToAccount(nextCredential)
      const row = exportRowForCredential(account, nextCredential, 'reset')
      rememberCredential(row)
      if (row) {
        setBatchFailures((current) => current.filter((failure) => failure.studentId !== account.studentId))
      }
      setCredentialStudentName(account.fullName)
      setCredential(nextCredential)
      setResetCandidate(null)
    } catch {
      setAccountActionError('The temporary password could not be issued. Please try again.')
    } finally {
      setAccountActionStudentId(null)
    }
  }

  async function runCredentialBatch() {
    if (batchRunActiveRef.current) return
    const targets = [...eligibleCredentialAccounts]
    if (targets.length === 0) return

    const validationError = validateCredentialBatchTargets(targets)
    if (validationError) {
      setAccountActionError(validationError)
      setConfirmCompleteCredentialFile(false)
      setCompleteCredentialAcknowledged(false)
      return
    }

    batchRunActiveRef.current = true
    setBatchProgress({ completed: 0, total: targets.length })
    setBatchProgressAnnouncement(`Preparing 0 of ${targets.length} student credentials.`)
    setBatchFailures([])
    setLastCredentialBatchTotal(targets.length)
    setIssuedCredentials([])
    setCredential(null)
    setResetCandidate(null)
    setAccountActionError(null)
    setCredentialDownloadError(null)
    setCredentialDownloadStarted(false)

    const rowsByIndex: Array<TemporaryCredentialExportRow | undefined> = Array.from({
      length: targets.length,
    })
    const failuresByIndex: Array<CredentialBatchFailure | undefined> = Array.from({
      length: targets.length,
    })

    try {
      await mapWithConcurrency(
        targets,
        async (account) => {
          const action: TemporaryCredentialAction = account.loginId ? 'reset' : 'created'
          const nextCredential = account.loginId
            ? await repository.resetStudentCredential(account.studentId)
            : await repository.issueStudentCredential(account.studentId)
          if (nextCredential.studentId !== account.studentId) {
            throw new Error('The credential response did not match the requested student.')
          }
          const row = exportRowForCredential(account, nextCredential, action)
          if (!row) throw new Error('The one-time credential was not returned.')
          return { credential: nextCredential, row }
        },
        CREDENTIAL_BATCH_CONCURRENCY,
        (result, completed, total) => {
          const account = targets[result.index]
          if (result.status === 'fulfilled') {
            rowsByIndex[result.index] = result.value.row
            applyCredentialToAccount(result.value.credential)
          } else {
            failuresByIndex[result.index] = {
              studentId: account.studentId,
              studentName: account.fullName,
              rollNumber: account.rollNo,
              batchCode: account.batchCode,
              reason: credentialBatchFailureReason(result.reason),
            }
          }

          setIssuedCredentials(rowsByIndex.filter((row) => row !== undefined))
          setBatchFailures(failuresByIndex.filter((failure) => failure !== undefined))
          setBatchProgress({ completed, total })
          if (completed === total || completed % 10 === 0) {
            setBatchProgressAnnouncement(
              `${completed} of ${total} student credentials processed.`,
            )
          }
        },
      )

      const completedRows = rowsByIndex.filter((row) => row !== undefined)
      const failures = failuresByIndex.filter((failure) => failure !== undefined)
      setIssuedCredentials(completedRows)
      setBatchFailures(failures)

      if (failures.length === 0 && completedRows.length === targets.length) {
        setCredentialDownloadState('preparing')
        try {
          await downloadTemporaryCredentialWorkbook(completedRows)
          setCredentialDownloadStarted(true)
        } catch {
          setCredentialDownloadError(
            'The accounts are ready, but the Excel download could not be started. Use the download button below.',
          )
        } finally {
          setCredentialDownloadState('idle')
        }
      }
    } finally {
      batchRunActiveRef.current = false
      setBatchProgress(null)
      setConfirmCompleteCredentialFile(false)
      setCompleteCredentialAcknowledged(false)
      setAccountReload((value) => value + 1)
    }
  }

  async function downloadCredentialFile() {
    if (issuedCredentials.length === 0 || credentialDownloadState === 'preparing') return
    setCredentialDownloadState('preparing')
    setCredentialDownloadError(null)
    try {
      await downloadTemporaryCredentialWorkbook(issuedCredentials)
      setCredentialDownloadStarted(true)
    } catch {
      setCredentialDownloadError('The credential workbook could not be created. Please try the download again.')
    } finally {
      setCredentialDownloadState('idle')
    }
  }

  function selectSection(section: AdminSection, focus = false) {
    setActiveSection(section)
    if (!focus) return
    const tab = section === 'workbooks' ? workbooksTabRef.current : studentAccessTabRef.current
    tab?.focus()
  }

  function handleSectionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextSection: AdminSection | null = null
    if (event.key === 'ArrowRight') {
      nextSection = activeSection === 'workbooks' ? 'student-access' : 'workbooks'
    } else if (event.key === 'ArrowLeft') {
      nextSection = activeSection === 'workbooks' ? 'student-access' : 'workbooks'
    } else if (event.key === 'Home') {
      nextSection = 'workbooks'
    } else if (event.key === 'End') {
      nextSection = 'student-access'
    }
    if (!nextSection) return
    event.preventDefault()
    selectSection(nextSection, true)
  }

  return (
    <main className="page-main" id="main-content" tabIndex={-1}>
      <section className="page-heading" aria-labelledby="admin-title">
        <div>
          <p className="eyebrow">Controlled workflow</p>
          <h1 id="admin-title">Admin portal</h1>
          <p>
            {isUnifiedAdmin
              ? 'Manage workbook publication and student access from one secure workspace.'
              : 'Upload, review server validation, and publish from one secure workflow.'}
          </p>
        </div>
        <div className="role-list" aria-label="Your admin permissions">
          {roles.map((role) => <span className="role-badge" key={role}>{role}</span>)}
        </div>
      </section>

      {isUnifiedAdmin && (
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button
            className="admin-tab"
            id="admin-tab-workbooks"
            type="button"
            role="tab"
            aria-selected={activeSection === 'workbooks'}
            aria-controls="admin-panel-workbooks"
            tabIndex={activeSection === 'workbooks' ? 0 : -1}
            ref={workbooksTabRef}
            onClick={() => selectSection('workbooks')}
            onKeyDown={handleSectionKeyDown}
          >
            Workbooks
          </button>
          <button
            className="admin-tab"
            id="admin-tab-student-access"
            type="button"
            role="tab"
            aria-selected={activeSection === 'student-access'}
            aria-controls="admin-panel-student-access"
            tabIndex={activeSection === 'student-access' ? 0 : -1}
            ref={studentAccessTabRef}
            onClick={() => selectSection('student-access')}
            onKeyDown={handleSectionKeyDown}
          >
            Student Access
          </button>
        </div>
      )}

      <div
        className="admin-panel"
        id={isUnifiedAdmin ? 'admin-panel-workbooks' : undefined}
        role={isUnifiedAdmin ? 'tabpanel' : undefined}
        aria-labelledby={isUnifiedAdmin ? 'admin-tab-workbooks' : undefined}
        hidden={isUnifiedAdmin && activeSection !== 'workbooks'}
      >
        <div className="admin-grid">
          {canUpload && (
            <section className="operations-card" aria-labelledby="upload-title">
            <div className="step-heading">
              <span>01</span>
              <div><p className="eyebrow">Admin upload</p><h2 id="upload-title">Review a workbook</h2></div>
            </div>
            <p>
              The workbook is uploaded to private storage and parsed by the server before publication is enabled.
            </p>
            <p className="alert alert-warning">
              <strong>Prefer the official template.</strong> Legacy workbooks can contain unrelated personal data in other tabs. Upload them only when institute-approved: the private server handles the workbook transiently, stages only the Sheet1 result projection, and deletes the raw file after a terminal outcome.
            </p>

            <div className="file-field">
              <label htmlFor="qpt-workbook">Choose QPT workbook</label>
              <input
                id="qpt-workbook"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                disabled={queueState === 'uploading'}
              />
              <small>Official template or supported legacy Sheet1 export · maximum 10 MB</small>
              <a className="template-link" href="/templates/qpt-import-template.xlsx" download>
                Download official template
              </a>
            </div>

            {file && !fileError && !queuedImport && (
              <p className="selected-file"><strong>{file.name}</strong><span>{Math.max(1, Math.ceil(file.size / 1024))} KB · ready for private upload</span></p>
            )}
            {fileError && <p className="alert alert-error" role="alert">{fileError}</p>}
            {queueError && <p className="alert alert-error" role="alert">{queueError}</p>}
            {queuedImport && (
              <p className="alert alert-success" role="status">
                <strong>{queuedImport.fileName}</strong> is queued for server validation. Publication is enabled only after validation succeeds.
              </p>
            )}
            {queuedImport && (!review || review.state === 'queued' || review.state === 'processing') && (
              <div className="inline-status" role="status"><span className="spinner" aria-hidden="true" />Server validation is in progress…</div>
            )}
            {reviewError && (
              <div className="alert alert-error" role="alert">
                <p>{reviewError}</p>
                <button
                  className="button button-quiet button-small"
                  type="button"
                  onClick={() => {
                    setReviewError(null)
                    setReviewReload((value) => value + 1)
                  }}
                >
                  Retry validation status now
                </button>
              </div>
            )}
            {review &&
              (review.state === 'ready' ||
                review.state === 'duplicate' ||
                review.state === 'rejected') && <ReviewCard review={review} />}
            {file && !queuedImport && (
              <button
                className="button button-primary"
                type="button"
                disabled={Boolean(fileError) || queueState === 'uploading'}
                onClick={() => void queueForValidation()}
              >
                {queueState === 'uploading' ? 'Uploading securely…' : 'Upload for server validation'}
              </button>
            )}
            </section>
          )}

          {canPublish && (
            <section className="operations-card" aria-labelledby="publish-title">
            <div className="step-heading">
              <span>02</span>
              <div><p className="eyebrow">Admin publish</p><h2 id="publish-title">Publish validated results</h2></div>
            </div>
            <p>
              {isUnifiedAdmin
                ? 'Only server-validated revisions are listed. Confirm the final review before students can see them.'
                : 'Only server-validated revisions are listed. A separate authorised publisher must confirm them.'}
            </p>

            {publishedMessage && <p className="alert alert-success" role="status">{publishedMessage}</p>}
            {publishError && <p className="alert alert-error" role="alert">{publishError}</p>}
            {pendingState === 'loading' ? (
              <div className="inline-status" role="status"><span className="spinner" aria-hidden="true" />Loading validated revisions…</div>
            ) : pendingState === 'error' ? (
              <PageStatus
                title="Validated revisions unavailable"
                message="The publication queue could not be loaded."
                kind="error"
                onRetry={() => setPendingReload((value) => value + 1)}
              />
            ) : pending.length === 0 ? (
              <div className="compact-empty"><strong>Nothing waiting for publication</strong><span>Validated revisions will appear here.</span></div>
            ) : (
              <ul className="revision-list">
                {pending.map((revision) => (
                  <li key={revision.revisionId}>
                    <div>
                      <strong>{revision.displayTitle}</strong>
                      <span>{revision.batchCode} · {displayDate(revision.testDate)} · {revision.rowCount} rows</span>
                      <small className="revision-number">Revision {revision.revisionNumber}</small>
                      <small>
                        {revision.subjects.length > 0
                          ? revision.subjects.map((subject) => subject.code).join(' · ')
                          : 'No subject summary'}
                      </small>
                      {revision.warnings.length > 0 && (
                        <small className="revision-warning">
                          {revision.warnings.length} server warning{revision.warnings.length === 1 ? '' : 's'} must be reviewed
                        </small>
                      )}
                      <small>Uploaded by {revision.uploadedByLabel}</small>
                    </div>
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      disabled={!revision.canPublish}
                      onClick={() => {
                        setPublishError(null)
                        setWarningsAcknowledged(false)
                        setConfirmRevision(revision)
                      }}
                    >
                      {!revision.isLatestRevision
                        ? 'Newer revision available'
                        : revision.canPublish
                        ? `Review ${revision.displayTitle} for publication`
                        : isUnifiedAdmin
                        ? 'Publication unavailable'
                        : 'Independent publisher required'}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {confirmRevision && (
              <div className="confirmation-panel" role="group" aria-labelledby="confirmation-title">
                <p className="eyebrow">Final check</p>
                <h3 id="confirmation-title">Publish {confirmRevision.displayTitle}?</h3>
                <p>
                  This immediately makes {confirmRevision.rowCount} result rows visible to their linked student accounts.
                </p>
                <dl className="review-metrics publication-metrics">
                  <div><dt>Assessment</dt><dd>{confirmRevision.assessmentCode}</dd></div>
                  <div><dt>Batch</dt><dd>{confirmRevision.batchCode}</dd></div>
                  <div><dt>Test date</dt><dd>{displayDate(confirmRevision.testDate)}</dd></div>
                  <div><dt>Revision</dt><dd>{confirmRevision.revisionNumber}</dd></div>
                </dl>
                <div className="subject-summary" aria-label="Revision subject summary">
                  {confirmRevision.subjects.map((subject) => (
                    <span key={subject.code}>
                      <strong>{subject.code}</strong>
                      {subject.rowCount} rows · max {subject.maximumMarks}
                    </span>
                  ))}
                </div>
                {Object.keys(confirmRevision.statusCounts).length > 0 && (
                  <div className="publication-status-summary" aria-label="Revision row status summary">
                    {Object.entries(confirmRevision.statusCounts).map(([status, count]) => (
                      <span key={status}><strong>{count}</strong> {displayStatus(status)}</span>
                    ))}
                  </div>
                )}
                {confirmRevision.warnings.length > 0 && (
                  <div className="alert alert-warning publication-warnings">
                    <strong>Review every server warning before publication</strong>
                    <ul>
                      {confirmRevision.warnings.map((warning, index) => (
                        <li key={`${warning.code}-${index}`}>
                          {warning.message}{issueLocation(warning)}
                        </li>
                      ))}
                    </ul>
                    <label className="warning-acknowledgement">
                      <input
                        type="checkbox"
                        checked={warningsAcknowledged}
                        onChange={(event) => setWarningsAcknowledged(event.target.checked)}
                        disabled={publishing}
                      />
                      <span>I reviewed the server warnings for this revision.</span>
                    </label>
                  </div>
                )}
                <div className="button-row">
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={publishing || (confirmRevision.warnings.length > 0 && !warningsAcknowledged)}
                    onClick={() => void publish()}
                  >
                    {publishing ? 'Publishing…' : 'Confirm publication'}
                  </button>
                  <button
                    className="button button-quiet"
                    type="button"
                    disabled={publishing}
                    onClick={() => {
                      setWarningsAcknowledged(false)
                      setConfirmRevision(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            </section>
          )}
        </div>
      </div>

      {isUnifiedAdmin && (
        <div
          className="admin-panel"
          id="admin-panel-student-access"
          role="tabpanel"
          aria-labelledby="admin-tab-student-access"
          hidden={activeSection !== 'student-access'}
        >
          <section className="operations-card student-access-card" aria-labelledby="student-access-title">
            <div className="step-heading">
              <span>03</span>
              <div>
                <p className="eyebrow">Admin accounts</p>
                <h2 id="student-access-title">Student access</h2>
              </div>
            </div>
            <p>
              Generate one staff-only Excel with a roll-number login and temporary password for every active
              student. Each student must replace that password at first sign in.
            </p>

            {accountState === 'ready' && studentAccounts.length > 0 && (
              <section className="credential-export-card" aria-labelledby="credential-export-title">
                <div>
                  <p className="eyebrow">One-time staff file</p>
                  <h3 id="credential-export-title">Student credential file</h3>
                  <p>
                    Generate one Excel file containing the login ID and a new temporary password for every
                    active student. If a login already exists, its password is replaced so every row in the
                    new file works.
                  </p>
                </div>

                <dl className="credential-export-summary">
                  <div><dt>Students in roster</dt><dd>{studentAccounts.length}</dd></div>
                  <div><dt>Included in file</dt><dd>{eligibleCredentialAccounts.length}</dd></div>
                  <div><dt>Passwords replaced</dt><dd>{existingCredentialAccountCount}</dd></div>
                </dl>

                <div className="button-row credential-export-actions">
                  <button
                    className="button button-primary button-small"
                    type="button"
                    ref={completeCredentialTriggerRef}
                    disabled={
                      batchProgress !== null
                      || accountActionStudentId !== null
                      || confirmCompleteCredentialFile
                      || issuedCredentials.length > 0
                      || eligibleCredentialAccounts.length === 0
                    }
                    onClick={() => {
                      if (existingCredentialAccountCount === 0) {
                        void runCredentialBatch()
                        return
                      }
                      setCompleteCredentialAcknowledged(false)
                      setConfirmCompleteCredentialFile(true)
                    }}
                  >
                    {batchProgress
                      ? `Preparing ${batchProgress.completed} of ${batchProgress.total}…`
                      : 'Generate & download all credentials'}
                  </button>
                </div>
                <p className="credential-export-note">
                  Existing passwords cannot be viewed or downloaded. Each run creates a complete fresh file
                  and requires students to change their temporary password at first sign in.
                  {issuedCredentials.length > 0
                    ? ' Save and clear the current in-memory file before generating another.'
                    : ''}
                  {excludedCredentialAccountCount > 0
                    ? ` ${excludedCredentialAccountCount} suspended or disabled account${excludedCredentialAccountCount === 1 ? ' is' : 's are'} excluded.`
                    : ''}
                </p>
              </section>
            )}

            {confirmCompleteCredentialFile && (
              <div
                className="confirmation-panel"
                role="group"
                aria-labelledby="complete-credential-title"
                ref={completeCredentialConfirmationRef}
                tabIndex={-1}
              >
                <p className="eyebrow">Destructive credential rotation</p>
                <h3 id="complete-credential-title">
                  Generate a new login file for {eligibleCredentialAccounts.length} student
                  {eligibleCredentialAccounts.length === 1 ? '' : 's'}?
                </h3>
                <p>
                  This will replace {existingCredentialAccountCount} existing password
                  {existingCredentialAccountCount === 1 ? '' : 's'}. Any older credential file and those
                  passwords will stop working. One Excel file will be prepared when finished.
                </p>
                <p>
                  The operation covers {eligibleCredentialAccounts.length} student
                  {eligibleCredentialAccounts.length === 1 ? '' : 's'}.
                  {excludedCredentialAccountCount > 0
                    ? ` ${excludedCredentialAccountCount} suspended or disabled account${excludedCredentialAccountCount === 1 ? ' is' : 's are'} excluded.`
                    : ''}
                </p>
                <label className="warning-acknowledgement">
                  <input
                    type="checkbox"
                    checked={completeCredentialAcknowledged}
                    onChange={(event) => setCompleteCredentialAcknowledged(event.target.checked)}
                    disabled={batchProgress !== null}
                  />
                  <span>I understand that older credential files and passwords will stop working.</span>
                </label>
                <div className="button-row credential-confirm-actions">
                  <button
                    className="button button-primary button-small"
                    type="button"
                    disabled={
                      !completeCredentialAcknowledged
                      || batchProgress !== null
                      || accountActionStudentId !== null
                    }
                    onClick={() => void runCredentialBatch()}
                  >
                    {batchProgress
                      ? `Preparing ${batchProgress.completed} of ${batchProgress.total}…`
                      : 'Replace passwords & download Excel'}
                  </button>
                  <button
                    className="button button-quiet button-small"
                    type="button"
                    disabled={batchProgress !== null}
                    onClick={() => {
                      setConfirmCompleteCredentialFile(false)
                      setCompleteCredentialAcknowledged(false)
                      completeCredentialTriggerRef.current?.focus()
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {batchProgress && (
              <div
                className="inline-status credential-batch-status"
                role="group"
                aria-label="Generating student credentials"
              >
                <span className="sr-only" aria-live="polite" aria-atomic="true">
                  {batchProgressAnnouncement}
                </span>
                <span className="spinner" aria-hidden="true" />
                <span>
                  Preparing student login file: {batchProgress.completed} of {batchProgress.total} processed.
                  Up to {CREDENTIAL_BATCH_CONCURRENCY} at once. Keep this page open.
                </span>
                <progress
                  aria-label={`${batchProgress.completed} of ${batchProgress.total} credentials processed`}
                  max={batchProgress.total}
                  value={batchProgress.completed}
                />
              </div>
            )}

            {batchProgress === null && batchFailures.length > 0 && (
              <div className="alert alert-error" role="alert">
                <strong>
                  {batchFailures.length} student credential{batchFailures.length === 1 ? '' : 's'} could not be issued
                </strong>
                <p>
                  {issuedCredentials.length} of {lastCredentialBatchTotal ?? issuedCredentials.length} credentials
                  are ready. A complete file was not downloaded. Save the successful rows below, then resolve
                  these students individually:
                </p>
                <ul>
                  {batchFailures.map((failure) => (
                    <li key={failure.studentId}>
                      <strong>{failure.studentName}</strong>{' — '}
                      Roll {failure.rollNumber} · Batch {failure.batchCode} · {failure.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {issuedCredentials.length > 0 && batchProgress === null && accountActionStudentId === null && (
              <div className="credential-download-panel" aria-labelledby="credential-download-title">
                <div className="credential-download-summary" role="status">
                  <p className="eyebrow">Sensitive file ready</p>
                  <h3 id="credential-download-title">
                    {batchFailures.length > 0
                      ? 'Credential file incomplete'
                      : credentialDownloadStarted
                        ? 'Download started'
                        : 'Credential file ready'}
                  </h3>
                  {batchFailures.length > 0 && lastCredentialBatchTotal ? (
                    <p>{issuedCredentials.length} of {lastCredentialBatchTotal} credentials are ready.</p>
                  ) : credentialDownloadStarted ? (
                    <p>
                      The complete {issuedCredentials.length}-student Excel download has started. Keep this page
                      open until you confirm the file is saved.
                    </p>
                  ) : (
                    <p>
                      {issuedCredentials.length} credential{issuedCredentials.length === 1 ? '' : 's'} ready for Excel download.
                    </p>
                  )}
                </div>
                <p>
                  Download on a trusted device, give each credential directly to the correct student, and
                  securely delete the file after distribution. Refreshing or closing this page loses this copy.
                </p>
                {credentialDownloadError && <p className="alert alert-error" role="alert">{credentialDownloadError}</p>}
                <div className="button-row">
                  <button
                    className="button button-primary button-small"
                    type="button"
                    disabled={credentialDownloadState === 'preparing' || batchProgress !== null}
                    onClick={() => void downloadCredentialFile()}
                  >
                    {credentialDownloadState === 'preparing'
                      ? 'Preparing secure Excel file…'
                      : batchFailures.length > 0
                        ? `Download ${issuedCredentials.length} successful credentials`
                        : credentialDownloadStarted
                          ? 'Download Excel again'
                          : 'Download credentials Excel'}
                  </button>
                  <button
                    className="button button-quiet button-small"
                    type="button"
                    disabled={credentialDownloadState === 'preparing' || batchProgress !== null}
                    onClick={() => {
                      setIssuedCredentials([])
                      setLastCredentialBatchTotal(null)
                      setCredentialDownloadStarted(false)
                      setCredentialDownloadError(null)
                      setCredential(null)
                      setCredentialStudentName('')
                    }}
                  >
                    I saved the file — clear credentials from this page
                  </button>
                </div>
              </div>
            )}

            {accountActionError && <p className="alert alert-error" role="alert">{accountActionError}</p>}
            {credential && credential.temporaryPassword && (
              <div
                className="credential-panel"
                role="status"
                aria-labelledby="credential-title"
                ref={credentialPanelRef}
                tabIndex={-1}
              >
                <p className="eyebrow">Give securely to {credentialStudentName}</p>
                <h3 id="credential-title">
                  {credential.state === 'provisioned'
                    ? 'Temporary login created'
                    : 'New temporary password issued'}
                </h3>
                <dl className="credential-values">
                  <div><dt>Login ID</dt><dd><code>{credential.loginId}</code></dd></div>
                  <div><dt>Temporary password</dt><dd><code>{credential.temporaryPassword}</code></dd></div>
                </dl>
                <p><strong>This password is shown only now.</strong> Give it directly to the student and dismiss this message.</p>
                <button className="button button-quiet button-small" type="button" onClick={() => setCredential(null)}>
                  I saved it securely
                </button>
              </div>
            )}
            {credential && !credential.temporaryPassword && (
              <p className="alert alert-warning" role="status">
                Login {credential.loginId} already exists. Use password reset only after confirming the student.
              </p>
            )}

            {resetCandidate && (
              <div className="confirmation-panel" role="group" aria-labelledby="reset-account-title">
                <p className="eyebrow">Identity check required</p>
                <h3 id="reset-account-title">
                  Issue a new temporary password for {resetCandidate.fullName}?
                </h3>
                <p>
                  The current password will stop working. The new temporary password will appear above the
                  student list and is shown only once.
                </p>
                <div className="button-row">
                  <button
                    className="button button-primary button-small"
                    type="button"
                    disabled={
                      batchProgress !== null
                      || accountActionStudentId !== null
                      || confirmCompleteCredentialFile
                    }
                    onClick={() => void resetAccount(resetCandidate)}
                  >
                    {accountActionStudentId === resetCandidate.studentId
                      ? 'Issuing…'
                      : 'Issue temporary password'}
                  </button>
                  <button className="button button-quiet button-small" type="button" onClick={() => setResetCandidate(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {accountState === 'loading' ? (
              <div className="inline-status" role="status"><span className="spinner" aria-hidden="true" />Loading student accounts…</div>
            ) : accountState === 'error' ? (
              <PageStatus
                title="Student accounts unavailable"
                message="The roster could not be loaded."
                kind="error"
                onRetry={() => setAccountReload((value) => value + 1)}
              />
            ) : studentAccounts.length === 0 ? (
              <div className="compact-empty"><strong>No students available yet</strong><span>Students appear here after a validated workbook creates the roster.</span></div>
            ) : (
              <div className="table-scroll account-table-scroll" tabIndex={0}>
                <table className="results-table account-table" aria-label="Student login accounts">
                  <thead>
                    <tr><th>Student</th><th>Roll / batch</th><th>Login</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {studentAccounts.map((account) => (
                      <tr key={account.studentId}>
                        <th scope="row">{account.fullName}</th>
                        <td>{account.rollNo}<small>{account.batchCode}</small></td>
                        <td>{account.loginId ?? 'Not created'}</td>
                        <td>
                          {account.loginId
                            ? account.mustChangePassword
                              ? 'Awaiting first password change'
                              : displayStatus(account.accountStatus)
                            : 'Not provisioned'}
                        </td>
                        <td>
                          {account.loginId && account.accountStatus !== 'active' ? (
                            <button className="button button-quiet button-small" type="button" disabled>
                              Account {account.accountStatus} for {account.fullName}
                            </button>
                          ) : account.loginId ? (
                            <button
                              className="button button-quiet button-small"
                              type="button"
                              disabled={
                                batchProgress !== null
                                || accountActionStudentId !== null
                                || confirmCompleteCredentialFile
                              }
                              onClick={() => setResetCandidate(account)}
                            >
                              Issue new temporary password for {account.fullName}
                            </button>
                          ) : (
                            <button
                              className="button button-secondary button-small"
                              type="button"
                              disabled={
                                batchProgress !== null
                                || accountActionStudentId !== null
                                || confirmCompleteCredentialFile
                              }
                              onClick={() => void provisionAccount(account)}
                            >
                              {accountActionStudentId === account.studentId
                                ? 'Creating login…'
                                : `Create login for ${account.fullName}`}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
