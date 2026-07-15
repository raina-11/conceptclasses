import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import type {
  PortalRepository,
  QueuedImport,
  ReviewIssue,
  WorkbookReview,
} from '../data/portal-repository'
import { mapWithConcurrency } from './concurrent-batch'

export const WORKBOOK_UPLOAD_CONCURRENCY = 3
export const MAX_WORKBOOK_BATCH_SIZE = 20
export const MAX_WORKBOOK_SIZE_BYTES = 10 * 1024 * 1024
export const WORKBOOK_UPLOAD_TIMEOUT_MS = 2 * 60 * 1_000
export const WORKBOOK_REVIEW_DEADLINE_MS = 5 * 60 * 1_000

const REVIEW_POLL_INTERVAL_MS = 2_000
const REVIEW_MAX_AUTO_RETRIES = 3
const REVIEW_REQUEST_TIMEOUT_MS = 15_000

type WorkbookJobState =
  | 'selected'
  | 'uploading'
  | 'queued'
  | 'reviewed'
  | 'review-attention'
  | 'upload-error'

type WorkbookJob = {
  id: string
  file: File
  state: WorkbookJobState
  fileError: string | null
  uploadError: string | null
  queuedImport: QueuedImport | null
}

type WorkbookBatchProgress = {
  completed: number
  total: number
}

class WorkbookOperationTimeoutError extends Error {}

class WorkbookBatchHaltedError extends Error {}

type WorkbookBatchUploadProps = {
  repository: PortalRepository
  canPublish: boolean
  onRevisionReady: () => void
  onProtectionChange?: (state: WorkbookUploadProtectionState) => void
}

export type WorkbookUploadProtectionState = 'clear' | 'busy' | 'attention'

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'The operation could not be completed. Please try again.'
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new WorkbookOperationTimeoutError(timeoutMessage)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
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

export function validateWorkbookFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'Choose an Excel workbook with the .xlsx extension.'
  }
  if (file.size < 1) return 'The workbook is empty.'
  if (file.size > MAX_WORKBOOK_SIZE_BYTES) {
    return 'The workbook is larger than the 10 MB upload limit.'
  }
  return null
}

function ReviewCard({ review }: { review: WorkbookReview }) {
  const headingId = useId()
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
    <section className="review-card" aria-labelledby={headingId}>
      <div className="review-header">
        <div>
          <p className="eyebrow">Server validation review</p>
          <h3 id={headingId}>{review.displayTitle}</h3>
          <p>{review.assessmentCode}</p>
        </div>
        <span
          className={`review-state ${stateClass}`}
          role="status"
          aria-label={stateLabel}
          aria-live="polite"
        >
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

function WorkbookReviewStatus({
  jobId,
  fileName,
  queuedImport,
  repository,
  onTerminal,
  onAttention,
  onResume,
  onDiscard,
}: {
  jobId: string
  fileName: string
  queuedImport: QueuedImport
  repository: PortalRepository
  onTerminal: (jobId: string, review: WorkbookReview) => void
  onAttention: (jobId: string) => void
  onResume: (jobId: string) => void
  onDiscard: (jobId: string, fileName: string) => void
}) {
  const [review, setReview] = useState<WorkbookReview | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewReload, setReviewReload] = useState(0)
  const [retryExhausted, setRetryExhausted] = useState(false)
  const reportedTerminal = useRef(false)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let consecutiveFailures = 0
    const pollingStartedAt = Date.now()

    const markReviewAttention = (message: string) => {
      if (!active) return
      setReviewError(message)
      setRetryExhausted(true)
      onAttention(jobId)
    }

    async function pollReview() {
      if (Date.now() - pollingStartedAt >= WORKBOOK_REVIEW_DEADLINE_MS) {
        markReviewAttention(
          'Server validation is taking longer than expected. Retry the status check, or stop tracking this workbook after confirming its final state with the institute.',
        )
        return
      }
      try {
        const nextReview = await withTimeout(
          repository.getImportReview(queuedImport.importId),
          REVIEW_REQUEST_TIMEOUT_MS,
          'The validation status request timed out.',
        )
        if (!active) return
        consecutiveFailures = 0
        setReview(nextReview)
        setReviewError(null)
        setRetryExhausted(false)
        if (nextReview.state === 'queued' || nextReview.state === 'processing') {
          const remaining = WORKBOOK_REVIEW_DEADLINE_MS - (Date.now() - pollingStartedAt)
          if (remaining <= 0) {
            markReviewAttention(
              'Server validation is taking longer than expected. Retry the status check, or stop tracking this workbook after confirming its final state with the institute.',
            )
          } else {
            timer = setTimeout(
              () => void pollReview(),
              Math.min(REVIEW_POLL_INTERVAL_MS, remaining),
            )
          }
        } else if (!reportedTerminal.current) {
          reportedTerminal.current = true
          onTerminal(jobId, nextReview)
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
        } else {
          markReviewAttention(
            'The latest server validation status could not be loaded. Retry when the connection is available.',
          )
        }
      }
    }

    void pollReview()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [jobId, onAttention, onTerminal, queuedImport.importId, repository, reviewReload])

  return (
    <>
      {!retryExhausted
        && (!review || review.state === 'queued' || review.state === 'processing') && (
        <div className="inline-status" role="status">
          <span className="spinner" aria-hidden="true" />
          Server validation for <strong>{fileName}</strong> is in progress…
        </div>
      )}
      {reviewError && (
        <div className="alert alert-error" role="alert">
          <p>{reviewError}</p>
          <div className="workbook-job-actions">
            <button
              className="button button-quiet button-small"
              type="button"
              aria-label={`Retry validation status for ${fileName}`}
              onClick={() => {
                setReviewError(null)
                setRetryExhausted(false)
                onResume(jobId)
                setReviewReload((value) => value + 1)
              }}
            >
              Retry validation status now
            </button>
            {retryExhausted && (
              <button
                className="button button-quiet button-small"
                type="button"
                aria-label={`Stop tracking validation for ${fileName}`}
                onClick={() => onDiscard(jobId, fileName)}
              >
                Stop tracking
              </button>
            )}
          </div>
        </div>
      )}
      {review &&
        (review.state === 'ready' ||
          review.state === 'duplicate' ||
          review.state === 'rejected') && <ReviewCard review={review} />}
    </>
  )
}

function newWorkbookJob(file: File): WorkbookJob {
  return {
    id: crypto.randomUUID(),
    file,
    state: 'selected',
    fileError: validateWorkbookFile(file),
    uploadError: null,
    queuedImport: null,
  }
}

export function WorkbookBatchUpload({
  repository,
  canPublish,
  onRevisionReady,
  onProtectionChange,
}: WorkbookBatchUploadProps) {
  const [jobs, setJobs] = useState<WorkbookJob[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [batchProgress, setBatchProgress] = useState<WorkbookBatchProgress | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchHaltedMessage, setBatchHaltedMessage] = useState<string | null>(null)
  const [retryInFlightCount, setRetryInFlightCount] = useState(0)
  const [underlyingUploadCount, setUnderlyingUploadCount] = useState(0)
  const [focusTarget, setFocusTarget] = useState<'input' | 'batch' | string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchListRef = useRef<HTMLDivElement>(null)
  const jobRefs = useRef(new Map<string, HTMLElement>())
  const underlyingUploads = useRef(new Map<File, Promise<QueuedImport>>())
  const retryInFlightCountRef = useRef(0)
  const onRevisionReadyRef = useRef(onRevisionReady)
  onRevisionReadyRef.current = onRevisionReady

  const workInProgress = batchRunning || jobs.some(
    (job) => job.state === 'uploading' || job.state === 'queued',
  )
  const hasUnresolvedAttention = jobs.some(
    (job) => job.state === 'upload-error' || job.state === 'review-attention',
  )
  const protectionState: WorkbookUploadProtectionState = workInProgress
    ? 'busy'
    : hasUnresolvedAttention
      ? 'attention'
      : 'clear'
  const selectedJobs = jobs.filter((job) => job.state === 'selected' && !job.fileError)
  const availableUploadSlots = Math.max(
    0,
    WORKBOOK_UPLOAD_CONCURRENCY - underlyingUploadCount,
  )

  useLayoutEffect(() => {
    onProtectionChange?.(protectionState)
  }, [onProtectionChange, protectionState])

  useLayoutEffect(() => {
    if (!focusTarget) return
    if (focusTarget === 'input') {
      if (fileInputRef.current && !fileInputRef.current.disabled) {
        fileInputRef.current.focus()
      } else {
        batchListRef.current?.focus()
      }
    } else if (focusTarget === 'batch') {
      batchListRef.current?.focus()
    } else {
      jobRefs.current.get(focusTarget)?.focus()
    }
    setFocusTarget(null)
  }, [focusTarget, jobs])

  useEffect(() => () => {
    onProtectionChange?.('clear')
  }, [onProtectionChange])

  useEffect(() => {
    if (protectionState === 'clear') return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [protectionState])

  const handleReviewTerminal = useCallback((jobId: string, review: WorkbookReview) => {
    setJobs((current) => current.map((job) =>
      job.id === jobId ? { ...job, state: 'reviewed' } : job,
    ))
    if (canPublish && review.state === 'ready') onRevisionReadyRef.current()
  }, [canPublish])

  const handleReviewAttention = useCallback((jobId: string) => {
    setJobs((current) => current.map((job) =>
      job.id === jobId ? { ...job, state: 'review-attention' } : job,
    ))
  }, [])

  const handleReviewResume = useCallback((jobId: string) => {
    setJobs((current) => current.map((job) =>
      job.id === jobId ? { ...job, state: 'queued' } : job,
    ))
    setFocusTarget(jobId)
  }, [])

  const discardUnresolvedReview = useCallback((jobId: string, fileName: string) => {
    const confirmed = window.confirm(
      `The server review for ${fileName} is unavailable. Stop tracking this workbook and discard its import reference from this page?`,
    )
    if (!confirmed) return
    setJobs((current) => current.filter((job) => job.id !== jobId))
    setFocusTarget('input')
  }, [])

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    setSelectionError(null)
    setBatchProgress(null)
    setBatchHaltedMessage(null)

    if (nextFiles.length > MAX_WORKBOOK_BATCH_SIZE) {
      setJobs([])
      setSelectionError(
        `Choose no more than ${MAX_WORKBOOK_BATCH_SIZE} workbooks in one batch.`,
      )
      return
    }

    setJobs(nextFiles.map(newWorkbookJob))
  }

  function patchJob(jobId: string, patch: Partial<WorkbookJob>) {
    setJobs((current) => current.map((job) =>
      job.id === jobId ? { ...job, ...patch } : job,
    ))
  }

  function trackedQueueWorkbook(file: File): Promise<QueuedImport> {
    const existing = underlyingUploads.current.get(file)
    if (existing) return existing

    const operation = repository.queueWorkbook(file)
    underlyingUploads.current.set(file, operation)
    setUnderlyingUploadCount(underlyingUploads.current.size)
    const clearIfCurrent = () => {
      if (underlyingUploads.current.get(file) !== operation) return
      underlyingUploads.current.delete(file)
      setUnderlyingUploadCount(underlyingUploads.current.size)
    }
    void operation.then(clearIfCurrent, clearIfCurrent)
    return operation
  }

  async function queueSelectedWorkbooks() {
    const uploadSlotsAtStart = Math.max(
      0,
      WORKBOOK_UPLOAD_CONCURRENCY - underlyingUploads.current.size,
    )
    if (selectedJobs.length === 0 || batchRunning || uploadSlotsAtStart === 0) return
    const batch = selectedJobs
    let halted = false
    let completedStartedJobs = 0
    setBatchRunning(true)
    setBatchProgress({ completed: 0, total: batch.length })
    setBatchHaltedMessage(null)
    setFocusTarget('batch')
    const batchIds = new Set(batch.map((job) => job.id))
    setJobs((current) => current.map((job) =>
      batchIds.has(job.id)
        ? { ...job, uploadError: null }
        : job,
    ))

    await mapWithConcurrency(
      batch,
      (job) => {
        if (halted) throw new WorkbookBatchHaltedError('Batch halted after a timeout.')
        patchJob(job.id, { state: 'uploading', uploadError: null })
        return withTimeout(
          trackedQueueWorkbook(job.file),
          WORKBOOK_UPLOAD_TIMEOUT_MS,
          'The upload response timed out. Its final server status is unknown; retry this workbook to resume the same import safely.',
        )
      },
      uploadSlotsAtStart,
      (result, _completed, total) => {
        const job = batch[result.index]
        if (
          result.status === 'rejected'
          && result.reason instanceof WorkbookBatchHaltedError
        ) return
        completedStartedJobs += 1
        if (result.status === 'fulfilled') {
          patchJob(job.id, {
            state: 'queued',
            queuedImport: result.value,
            uploadError: null,
          })
        } else {
          if (result.reason instanceof WorkbookOperationTimeoutError) {
            halted = true
            setBatchHaltedMessage(
              'A workbook response timed out, so the remaining queued files were not started. This keeps active network uploads within the three-file limit. Resolve the timed-out workbook, then upload the remaining files.',
            )
          }
          patchJob(job.id, {
            state: 'upload-error',
            uploadError: errorMessage(result.reason),
          })
        }
        setBatchProgress({ completed: completedStartedJobs, total })
      },
    )

    setBatchRunning(false)
  }

  async function retryWorkbook(job: WorkbookJob) {
    if (
      job.state !== 'upload-error'
      || batchRunning
      || retryInFlightCountRef.current >= WORKBOOK_UPLOAD_CONCURRENCY
      || (
        !underlyingUploads.current.has(job.file)
        && underlyingUploads.current.size >= WORKBOOK_UPLOAD_CONCURRENCY
      )
    ) return
    retryInFlightCountRef.current += 1
    setRetryInFlightCount(retryInFlightCountRef.current)
    patchJob(job.id, { state: 'uploading', uploadError: null })
    setFocusTarget(job.id)
    try {
      const queuedImport = await withTimeout(
        trackedQueueWorkbook(job.file),
        WORKBOOK_UPLOAD_TIMEOUT_MS,
        'The upload response timed out. Its final server status is unknown; retry this workbook to resume the same import safely.',
      )
      patchJob(job.id, { state: 'queued', queuedImport })
    } catch (error) {
      patchJob(job.id, {
        state: 'upload-error',
        uploadError: errorMessage(error),
      })
    } finally {
      retryInFlightCountRef.current -= 1
      setRetryInFlightCount(retryInFlightCountRef.current)
    }
  }

  function discardFailedWorkbook(job: WorkbookJob) {
    if (job.state !== 'upload-error' || workInProgress) return
    const confirmed = window.confirm(
      `The final server status for ${job.file.name} is unknown. Retrying is safer. Stop tracking this workbook and discard its retry information?`,
    )
    if (!confirmed) return
    setJobs((current) => current.filter((candidate) => candidate.id !== job.id))
    setFocusTarget('input')
  }

  const uploadButtonLabel = batchRunning
    ? `Processing ${batchProgress?.completed ?? 0} of ${batchProgress?.total ?? selectedJobs.length} workbooks…`
    : selectedJobs.length === 1
      ? 'Upload for server validation'
      : selectedJobs.length > 1
        ? `Upload ${selectedJobs.length} workbooks for server validation`
        : 'Choose another workbook batch'

  return (
    <section className="operations-card" aria-labelledby="upload-title">
      <div className="step-heading">
        <span>01</span>
        <div><p className="eyebrow">Admin upload</p><h2 id="upload-title">Review workbooks</h2></div>
      </div>
      <p>
        Select one or more workbooks. Up to {WORKBOOK_UPLOAD_CONCURRENCY} upload and validation pipelines run in parallel, while every file keeps its own review result.
      </p>
      <p className="alert alert-warning">
        <strong>Prefer the official template.</strong> Legacy workbooks can contain unrelated personal data in other tabs. Upload them only when institute-approved: the private server handles each workbook transiently, stages only the Sheet1 result projection, and deletes the raw file after a terminal outcome.
      </p>

      <div className="file-field">
        <label htmlFor="qpt-workbook">Choose QPT workbook</label>
        <input
          id="qpt-workbook"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFiles}
          disabled={workInProgress || hasUnresolvedAttention}
        />
        <small>
          Up to {MAX_WORKBOOK_BATCH_SIZE} official templates or supported legacy Sheet1 exports · maximum 10 MB each
        </small>
        <a className="template-link" href="/templates/qpt-import-template.xlsx" download>
          Download official template
        </a>
      </div>

      {selectionError && <p className="alert alert-error" role="alert">{selectionError}</p>}
      {batchHaltedMessage && (
        <p className="alert alert-warning" role="status">{batchHaltedMessage}</p>
      )}

      {jobs.length > 0 && (
        <div
          className="workbook-batch-list"
          aria-label="Selected workbook upload status"
          ref={batchListRef}
          tabIndex={-1}
        >
          {jobs.map((job) => (
            <article
              className="workbook-job"
              key={job.id}
              aria-labelledby={`workbook-job-${job.id}`}
              tabIndex={-1}
              ref={(element) => {
                if (element) jobRefs.current.set(job.id, element)
                else jobRefs.current.delete(job.id)
              }}
            >
              <div className="selected-file">
                <strong id={`workbook-job-${job.id}`}>{job.file.name}</strong>
                <span>
                  {Math.max(1, Math.ceil(job.file.size / 1024))} KB · {
                    job.fileError
                      ? 'cannot upload'
                      : job.state === 'selected'
                        ? 'ready for private upload'
                        : job.state === 'uploading'
                          ? 'uploading securely'
                          : job.state === 'upload-error'
                            ? 'upload failed'
                            : job.state === 'queued'
                              ? 'server validation queued'
                              : job.state === 'review-attention'
                                ? 'review status unavailable'
                                : 'server review complete'
                  }
                </span>
              </div>

              {job.fileError && <p className="alert alert-error" role="alert">{job.fileError}</p>}
              {job.state === 'uploading' && (
                <div className="inline-status" role="status">
                  <span className="spinner" aria-hidden="true" />
                  Uploading <strong>{job.file.name}</strong> securely…
                </div>
              )}
              {job.state === 'upload-error' && (
                <div className="alert alert-error" role="alert">
                  <p>{job.uploadError}</p>
                  <div className="workbook-job-actions">
                    <button
                      className="button button-quiet button-small"
                      type="button"
                      aria-label={`Retry upload for ${job.file.name}`}
                      disabled={
                        batchRunning
                        || retryInFlightCount >= WORKBOOK_UPLOAD_CONCURRENCY
                        || (
                          !underlyingUploads.current.has(job.file)
                          && underlyingUploadCount >= WORKBOOK_UPLOAD_CONCURRENCY
                        )
                      }
                      onClick={() => void retryWorkbook(job)}
                    >
                      Retry this workbook
                    </button>
                    <button
                      className="button button-quiet button-small"
                      type="button"
                      aria-label={`Discard failed upload for ${job.file.name}`}
                      disabled={workInProgress}
                      onClick={() => discardFailedWorkbook(job)}
                    >
                      Stop tracking
                    </button>
                  </div>
                </div>
              )}
              {job.queuedImport && (
                <>
                  <p className="alert alert-success" role="status">
                    <strong>{job.queuedImport.fileName}</strong> is queued for server validation. Publication is enabled only after validation succeeds.
                  </p>
                  <WorkbookReviewStatus
                    key={job.queuedImport.importId}
                    jobId={job.id}
                    fileName={job.file.name}
                    queuedImport={job.queuedImport}
                    repository={repository}
                    onTerminal={handleReviewTerminal}
                    onAttention={handleReviewAttention}
                    onResume={handleReviewResume}
                    onDiscard={discardUnresolvedReview}
                  />
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {batchProgress && batchRunning && (
        <div className="inline-status workbook-batch-progress" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>
            Processed {batchProgress.completed} of {batchProgress.total} workbooks. Up to {WORKBOOK_UPLOAD_CONCURRENCY} run at once.
          </span>
          <progress
            aria-label="Workbook batch processing progress"
            value={batchProgress.completed}
            max={batchProgress.total}
          >
            {batchProgress.completed} of {batchProgress.total}
          </progress>
        </div>
      )}

      {!workInProgress && underlyingUploadCount > 0 && (
        <p className="inline-status" role="status">
          {underlyingUploadCount} timed-out network request{underlyingUploadCount === 1 ? '' : 's'} still settling. New work starts only when a real upload slot is available.
        </p>
      )}

      {jobs.length > 0
        && !hasUnresolvedAttention
        && (selectedJobs.length > 0 || !workInProgress) && (
        <button
          className="button button-primary"
          type="button"
          disabled={
            batchRunning
            || availableUploadSlots === 0
            || jobs.every((job) => Boolean(job.fileError))
          }
          onClick={() => {
            if (selectedJobs.length > 0) {
              void queueSelectedWorkbooks()
            } else {
              if (fileInputRef.current) fileInputRef.current.value = ''
              fileInputRef.current?.click()
            }
          }}
        >
          {uploadButtonLabel}
        </button>
      )}
    </section>
  )
}
