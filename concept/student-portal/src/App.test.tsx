import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App, PORTAL_CONTEXT_TIMEOUT_MS, PORTAL_IDLE_TIMEOUT_MS } from './App'
import {
  WORKBOOK_REVIEW_DEADLINE_MS,
  WORKBOOK_UPLOAD_TIMEOUT_MS,
} from './admin/WorkbookBatchUpload'
import { downloadTemporaryCredentialWorkbook } from './admin/temporary-credential-workbook'
import type {
  PendingRevision,
  PortalRepository,
  PortalSession,
  QueuedImport,
  StudentQptInsight,
  WorkbookReview,
} from './data/portal-repository'
import type { StudentResultRow } from './domain/qpt/result-summary'

vi.mock('./admin/temporary-credential-workbook', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./admin/temporary-credential-workbook')>()),
  downloadTemporaryCredentialWorkbook: vi.fn(),
}))

const downloadCredentialWorkbookMock = vi.mocked(downloadTemporaryCredentialWorkbook)

const session: PortalSession = {
  userId: 'user-1',
  accountLabel: '0012',
}

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })

  return { promise, resolve }
}

function workbookFile(name: string): File {
  return new File([`synthetic-${name}`], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
  downloadCredentialWorkbookMock.mockReset()
})

const results: StudentResultRow[] = [
  {
    assessmentId: 'assessment-1',
    assessmentCode: 'QPT-1',
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
    assessmentId: 'assessment-2',
    assessmentCode: 'QPT-2',
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
]

const qptInsights: StudentQptInsight[] = [
  {
    assessmentId: 'assessment-1',
    qptNumber: 1,
    displayTitle: 'QPT 1',
    testDate: '2026-07-01',
    subjectCode: 'PHY',
    subjectName: 'Physics',
    maxMarks: '100',
    studentScore: '70',
    status: 'present',
    rank: 2,
    highestScore: '94',
    averageScore: '61.5',
    participantCount: 30,
  },
  {
    assessmentId: 'assessment-2',
    qptNumber: 2,
    displayTitle: 'QPT 2',
    testDate: '2026-07-08',
    subjectCode: 'CHEM',
    subjectName: 'Chemistry',
    maxMarks: '80',
    studentScore: null,
    status: 'absent',
    rank: null,
    highestScore: '76',
    averageScore: '52.25',
    participantCount: 29,
  },
]

const review: WorkbookReview = {
  importId: 'import-1',
  fileName: 'qpt-5.xlsx',
  state: 'ready',
  format: 'legacy',
  parserVersion: 'legacy-sheet1-v1',
  assessmentCode: 'QPT-5-2026-07-13-10E',
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
    { code: 'MATHS', rowCount: 20, maximumMarks: '100' },
  ],
  statusCounts: { PRESENT: 58, ABSENT: 2 },
  warnings: [],
  blockingIssues: [],
  revisionId: 'revision-1',
}

const pendingRevision: PendingRevision = {
  revisionId: 'revision-1',
  activeRevisionId: 'revision-active',
  revisionNumber: 2,
  isLatestRevision: true,
  assessmentCode: review.assessmentCode,
  displayTitle: review.displayTitle,
  batchCode: review.batchCode,
  testDate: review.testDate,
  rowCount: review.rowCount,
  subjects: review.subjects,
  statusCounts: review.statusCounts,
  warnings: [
    {
      code: 'name_review',
      message: 'Review one normalized student name before publication.',
      row: 8,
    },
  ],
  uploadedByLabel: 'Another uploader',
  stagedAt: '2026-07-13T12:00:00Z',
  canPublish: true,
}

function createRepository(
  overrides: Partial<PortalRepository> = {},
): PortalRepository {
  const activityKey = `concept-qpt:last-activity:${session.userId}`
  if (!Object.hasOwn(overrides, 'getSession') && window.localStorage.getItem(activityKey) === null) {
    window.localStorage.setItem(activityKey, String(Date.now()))
  }
  return {
    getSession: vi.fn().mockResolvedValue(session),
    onAuthChange: vi.fn().mockReturnValue(() => undefined),
    signIn: vi.fn().mockResolvedValue(session),
    changeInitialPassword: vi.fn().mockResolvedValue(undefined),
    discardLocalSession: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    getPortalContext: vi.fn().mockResolvedValue({
      roles: [],
      mustChangePassword: false,
      students: [
        {
          id: 'student-1',
          fullName: 'Synthetic Student A',
          rollNo: '0012',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        },
      ],
    }),
    getStudentResults: vi.fn().mockResolvedValue(results),
    getStudentQptInsights: vi.fn().mockResolvedValue(qptInsights),
    getStudentAccounts: vi.fn().mockResolvedValue([]),
    issueStudentCredential: vi.fn().mockResolvedValue({
      studentId: 'student-1',
      loginId: '0012',
      temporaryPassword: 'TempSecure9A',
      state: 'provisioned',
    }),
    resetStudentCredential: vi.fn().mockResolvedValue({
      studentId: 'student-1',
      loginId: '0012',
      temporaryPassword: 'ResetSecure9A',
      state: 'reset-required',
    }),
    queueWorkbook: vi.fn().mockResolvedValue({
      importId: 'import-1',
      fileName: 'qpt-5.xlsx',
      state: 'queued',
    }),
    getImportReview: vi.fn().mockResolvedValue(review),
    getPendingRevisions: vi.fn().mockResolvedValue([]),
    publishRevision: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('student portal', () => {
  it('signs in with an accessible roll-number and password form', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue(null),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('img', { name: 'Concept Institute' })).toBeVisible()
    await user.type(await screen.findByLabelText('Roll number or admin ID'), '0012')
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(repository.signIn).toHaveBeenCalledWith(
      '0012',
      'secure-password',
    )
    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Concept Institute' })).toBeVisible()
  })

  it('establishes activity before a synchronous signed-in callback can inspect the session', async () => {
    const user = userEvent.setup()
    let authListener: Parameters<PortalRepository['onAuthChange']>[0] | null = null
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue(null),
      onAuthChange: vi.fn((listener) => {
        authListener = listener
        return () => undefined
      }),
      signIn: vi.fn().mockImplementation(async () => {
        authListener?.(session, 'signed-in')
        return session
      }),
    })

    render(<App repository={repository} />)

    await user.type(await screen.findByLabelText('Roll number or admin ID'), '0012')
    await user.type(screen.getByLabelText('Password'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(repository.signOut).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(`concept-qpt:last-activity:${session.userId}`)).not.toBeNull()
  })

  it('defers auth-driven portal requests until the auth callback has unwound', async () => {
    vi.useFakeTimers()
    const repository = createRepository({
      onAuthChange: vi.fn((listener) => {
        listener(session, 'initial')
        return () => undefined
      }),
    })

    try {
      render(<App repository={repository} />)

      expect(repository.getPortalContext).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(repository.getPortalContext).toHaveBeenCalledOnce()
      expect(screen.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends a stalled portal-context load with a retryable error', async () => {
    vi.useFakeTimers()
    const repository = createRepository({
      getPortalContext: vi.fn().mockImplementation(() => new Promise(() => undefined)),
    })

    try {
      render(<App repository={repository} />)

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByRole('heading', { name: 'Preparing your portal' })).toBeVisible()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_CONTEXT_TIMEOUT_MS)
      })

      expect(screen.getByRole('heading', { name: 'Portal details unavailable' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('announces a sign-in failure without exposing backend details', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockRejectedValue(new Error('Invalid login credentials: internal trace')),
    })

    render(<App repository={repository} />)

    await user.type(await screen.findByLabelText('Roll number or admin ID'), '0012')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The roll number/admin ID or password is incorrect. Please try again.',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('internal trace')
  })

  it('directs forgotten-password users to the institute without asking for email', async () => {
    const user = userEvent.setup()
    const repository = createRepository({ getSession: vi.fn().mockResolvedValue(null) })

    render(<App repository={repository} />)

    await user.click(await screen.findByRole('button', { name: 'Forgot password?' }))

    expect(screen.getByRole('heading', { name: 'Ask Concept for a reset' })).toBeVisible()
    expect(screen.getByText(/new temporary password/i)).toBeVisible()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('forces a Concept-issued temporary password to be replaced before results load', async () => {
    const user = userEvent.setup()
    const getPortalContext = vi
      .fn()
      .mockResolvedValueOnce({ roles: [], students: [], mustChangePassword: true })
      .mockResolvedValueOnce({
        roles: [],
        mustChangePassword: false,
        students: [{
          id: 'student-1',
          fullName: 'Synthetic Student A',
          rollNo: '0012',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        }],
      })
    const repository = createRepository({
      getPortalContext,
      changeInitialPassword: vi.fn().mockResolvedValue(undefined),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Create your private password' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Concept Institute' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Your QPT results' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('New password'), 'NewSecurePass9')
    await user.type(screen.getByLabelText('Confirm new password'), 'NewSecurePass9')
    await user.click(screen.getByRole('button', { name: 'Save private password' }))

    expect(repository.changeInitialPassword).toHaveBeenCalledWith('NewSecurePass9')
    expect(repository.discardLocalSession).toHaveBeenCalledOnce()
    expect(repository.signOut).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Student sign in' })).toBeVisible()
    expect(screen.getByText(/password is saved.*sign in again/i)).toBeVisible()

    await user.type(screen.getByLabelText('Roll number or admin ID'), '0012')
    await user.type(screen.getByLabelText('Password'), 'NewSecurePass9')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(repository.signIn).toHaveBeenCalledWith('0012', 'NewSecurePass9')
    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(getPortalContext).toHaveBeenCalledTimes(2)
  })

  it('selects a linked student, filters subjects, and recomputes visible totals', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: [],
        mustChangePassword: false,
        students: [
          {
            id: 'student-1',
            fullName: 'Synthetic Student A',
            rollNo: '0012',
            batchCode: '10-E',
            batchName: 'Class 10 Evening',
          },
          {
            id: 'student-2',
            fullName: 'Synthetic Student B',
            rollNo: '0013',
            batchCode: '9-M',
            batchName: 'Class 9 Morning',
          },
        ],
      }),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(screen.getByLabelText('Student')).toHaveValue('student-1')
    expect(screen.getByRole('option', { name: /Synthetic Student B/ })).toBeInTheDocument()

    const totals = await screen.findByTestId('grand-totals')
    expect(within(totals).getByText('70 / 180')).toBeVisible()
    expect(within(totals).getByText('38.89%')).toBeVisible()

    await user.selectOptions(screen.getByLabelText('Subject'), 'PHY')

    const resultTable = screen.getByRole('table', {
      name: 'Published QPT results and visible grand totals',
    })
    expect(within(resultTable).getByText('Physics')).toBeVisible()
    expect(within(resultTable).queryByText('Chemistry')).not.toBeInTheDocument()
    expect(within(totals).getByText('70 / 100')).toBeVisible()
    expect(within(totals).getByText('70%')).toBeVisible()

    await user.selectOptions(screen.getByLabelText('Student'), 'student-2')
    expect(repository.getStudentResults).toHaveBeenLastCalledWith('student-2')
    expect(repository.getStudentQptInsights).toHaveBeenLastCalledWith('student-2')
  })

  it('shows batch QPT insights without exposing another student identity', async () => {
    const repository = createRepository()

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Your QPT comparison' })).toBeVisible()
    expect(repository.getStudentQptInsights).toHaveBeenCalledWith('student-1')
    const insights = screen.getByRole('region', { name: 'Exact QPT performance values. Scroll horizontally on small screens.' })
    expect(within(insights).getByText('94 / 100')).toBeVisible()
    expect(within(insights).getByText('61.5 / 100')).toBeVisible()
    expect(screen.queryByText(/other student/i)).not.toBeInTheDocument()
  })

  it('keeps published results available when aggregate insights fail', async () => {
    const repository = createRepository({
      getStudentQptInsights: vi.fn().mockRejectedValue(new Error('insights unavailable')),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Assessment history' })).toBeVisible()
    expect(screen.getByText('QPT insights are temporarily unavailable.')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Results unavailable' })).not.toBeInTheDocument()
  })

  it('reviews and queues an XLSX, then confirms a publish action by role', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getPendingRevisions: vi.fn().mockResolvedValue([pendingRevision]),
    })

    render(<App repository={repository} initialView="admin" />)

    expect(await screen.findByRole('heading', { name: 'Admin portal' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Workbooks' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Student Access' })).toHaveAttribute('aria-selected', 'false')
    expect(
      screen.getByText(/legacy workbooks can contain unrelated personal data/i),
    ).toBeVisible()
    const file = new File(['workbook'], 'qpt-5.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    await user.upload(screen.getByLabelText('Choose QPT workbook'), file)

    await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))
    expect(repository.queueWorkbook).toHaveBeenCalledWith(file)
    expect(await screen.findByText(/queued for server validation/i)).toBeVisible()
    expect(await screen.findByRole('heading', { name: 'QPT 5' })).toBeVisible()
    expect(screen.getByText('60 score rows')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Review QPT 5 for publication' }))
    expect(screen.getByText('Revision 2')).toBeVisible()
    expect(screen.getByText(/Review one normalized student name before publication\./)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Confirm publication' })).toBeDisabled()

    await user.click(screen.getByLabelText('I reviewed the server warnings for this revision.'))
    await user.click(screen.getByRole('button', { name: 'Confirm publication' }))
    expect(repository.publishRevision).toHaveBeenCalledWith(
      'revision-1',
      'revision-active',
    )
    expect(await screen.findByText('QPT 5 was published.')).toBeVisible()
  })

  describe('parallel workbook uploads', () => {
    it('exposes a workbook input that accepts multiple files', async () => {
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      expect(input).toHaveAttribute('multiple')
    })

    it('starts three selected workbook uploads in parallel before any resolves', async () => {
      const user = userEvent.setup()
      const files = [
        workbookFile('qpt-one.xlsx'),
        workbookFile('qpt-two.xlsx'),
        workbookFile('qpt-three.xlsx'),
      ]
      const gates = new Map(files.map((file) => [file, deferred<QueuedImport>()]))
      const started: File[] = []
      const queueWorkbook = vi.fn((file: File) => {
        started.push(file)
        return gates.get(file)?.promise ?? Promise.reject(new Error('Unexpected workbook'))
      })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview: vi.fn(() => new Promise<WorkbookReview>(() => undefined)),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      fireEvent.change(input, { target: { files } })
      const uploadButton = screen.getByRole('button', { name: /Upload.*server validation/i })
      await user.click(uploadButton)

      await waitFor(() => expect(started).toEqual(files))
      for (const file of files) {
        expect(screen.getByRole('article', { name: file.name })).toBeVisible()
      }
      expect(screen.getByRole('progressbar', {
        name: 'Workbook batch processing progress',
      })).toBeVisible()

      for (const [index, file] of files.entries()) {
        gates.get(file)?.resolve({
          importId: `import-${index + 1}`,
          fileName: file.name,
          state: 'queued',
        })
      }

      await waitFor(() => expect(uploadButton).toBeEnabled())
    })

    it('starts a fourth workbook only after one of the three parallel slots settles', async () => {
      const user = userEvent.setup()
      const files = [
        workbookFile('qpt-one.xlsx'),
        workbookFile('qpt-two.xlsx'),
        workbookFile('qpt-three.xlsx'),
        workbookFile('qpt-four.xlsx'),
      ]
      const gates = new Map(files.map((file) => [file, deferred<QueuedImport>()]))
      const started: File[] = []
      const queueWorkbook = vi.fn((file: File) => {
        started.push(file)
        return gates.get(file)?.promise ?? Promise.reject(new Error('Unexpected workbook'))
      })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview: vi.fn(() => new Promise<WorkbookReview>(() => undefined)),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      fireEvent.change(input, { target: { files } })
      await user.click(screen.getByRole('button', { name: /Upload.*server validation/i }))

      await waitFor(() => expect(started).toEqual(files.slice(0, 3)))
      expect(started).toHaveLength(3)

      gates.get(files[1])?.resolve({
        importId: 'import-2',
        fileName: files[1].name,
        state: 'queued',
      })
      await waitFor(() => expect(started).toEqual(files))

      for (const [index, file] of files.entries()) {
        if (index === 1) continue
        gates.get(file)?.resolve({
          importId: `import-${index + 1}`,
          fileName: file.name,
          state: 'queued',
        })
      }
    })

    it('halts unstarted files when timeouts leave three real requests in flight', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const files = [
        workbookFile('hung-one.xlsx'),
        workbookFile('hung-two.xlsx'),
        workbookFile('hung-three.xlsx'),
        workbookFile('must-not-start.xlsx'),
      ]
      const queueWorkbook = vi.fn(() => new Promise<QueuedImport>(() => undefined))
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
      })
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      try {
        render(<App repository={repository} initialView="admin" />)
        await user.upload(await screen.findByLabelText('Choose QPT workbook'), files)
        await user.click(screen.getByRole('button', { name: 'Upload 4 workbooks for server validation' }))
        await waitFor(() => expect(queueWorkbook).toHaveBeenCalledTimes(3))

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORKBOOK_UPLOAD_TIMEOUT_MS)
        })

        expect(queueWorkbook).toHaveBeenCalledTimes(3)
        expect(screen.getByRole('article', { name: files[3].name })).toHaveTextContent(
          /ready for private upload/i,
        )
        expect(screen.getByText(/remaining queued files were not started/i))
          .toHaveAttribute('role', 'status')

        await user.click(screen.getByRole('button', {
          name: `Retry upload for ${files[0].name}`,
        }))
        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORKBOOK_UPLOAD_TIMEOUT_MS)
        })
        expect(queueWorkbook).toHaveBeenCalledTimes(3)

        for (const file of files.slice(0, 3)) {
          await user.click(screen.getByRole('button', {
            name: `Discard failed upload for ${file.name}`,
          }))
        }
        expect(screen.getByRole('button', {
          name: 'Upload for server validation',
        })).toBeDisabled()
        expect(queueWorkbook).toHaveBeenCalledTimes(3)
      } finally {
        confirm.mockRestore()
        vi.useRealTimers()
      }
    })

    it('uploads valid workbooks while showing independent client errors for invalid files', async () => {
      const user = userEvent.setup()
      const valid = workbookFile('qpt-valid.xlsx')
      const unsupported = new File(['csv'], 'qpt-invalid.csv', { type: 'text/csv' })
      const oversized = workbookFile('qpt-too-large.xlsx')
      Object.defineProperty(oversized, 'size', { value: 10 * 1024 * 1024 + 1 })
      const queueWorkbook = vi.fn(async (file: File): Promise<QueuedImport> => ({
        importId: 'import-valid',
        fileName: file.name,
        state: 'queued',
      }))
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview: vi.fn(() => new Promise<WorkbookReview>(() => undefined)),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      fireEvent.change(input, { target: { files: [valid, unsupported, oversized] } })

      expect(screen.getByText(/\.xlsx extension/i)).toBeVisible()
      expect(screen.getByText(/larger than the 10 MB/i)).toBeVisible()
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      await waitFor(() => expect(queueWorkbook).toHaveBeenCalledOnce())
      expect(queueWorkbook).toHaveBeenCalledWith(valid)
    })

    it('disables portal sign-out until an active workbook reaches a terminal review', async () => {
      const user = userEvent.setup()
      const file = workbookFile('qpt-protected.xlsx')
      const queueGate = deferred<QueuedImport>()
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook: vi.fn(() => queueGate.promise),
        getImportReview: vi.fn().mockResolvedValue({
          ...review,
          importId: 'import-protected',
          fileName: file.name,
        }),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText('Choose QPT workbook')
      fireEvent.change(input, { target: { files: [file] } })
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      await waitFor(() => expect(repository.queueWorkbook).toHaveBeenCalledWith(file))
      expect(screen.getByLabelText('Selected workbook upload status')).toHaveFocus()
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute(
        'title',
        expect.stringMatching(/workbook uploads/i),
      )
      const busyMessage = screen.getByText(
        'Wait for workbook uploads and server validation before signing out.',
      )
      expect(busyMessage).toHaveAttribute('role', 'status')
      expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute(
        'aria-describedby',
        busyMessage.id,
      )

      queueGate.resolve({
        importId: 'import-protected',
        fileName: file.name,
        state: 'queued',
      })

      expect(await screen.findByRole('heading', { name: 'QPT 5' })).toBeVisible()
      expect(screen.getByRole('status', { name: 'Server validated' })).toBeVisible()
      await waitFor(() => expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled())
    })

    it('turns a hung upload into a bounded, recoverable unknown-status state', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook: vi.fn(() => new Promise<QueuedImport>(() => undefined)),
      })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      try {
        render(<App repository={repository} initialView="admin" />)
        const file = workbookFile('qpt-hung-upload.xlsx')
        await user.upload(await screen.findByLabelText('Choose QPT workbook'), file)
        await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORKBOOK_UPLOAD_TIMEOUT_MS)
        })

        expect(await screen.findByRole('alert')).toHaveTextContent(/upload response timed out/i)
        expect(screen.getByRole('button', {
          name: `Retry upload for ${file.name}`,
        })).toBeVisible()
        expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('protects an ambiguous upload failure until retry or explicit discard', async () => {
      const user = userEvent.setup()
      const file = workbookFile('qpt-unknown-status.xlsx')
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook: vi.fn().mockRejectedValue(new Error('Connection response was lost.')),
      })
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

      try {
        render(<App repository={repository} initialView="admin" />)

        const input = await screen.findByLabelText('Choose QPT workbook')
        fireEvent.change(input, { target: { files: [file] } })
        await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

        const retry = await screen.findByRole('button', {
          name: `Retry upload for ${file.name}`,
        })
        expect(input).toBeDisabled()
        expect(screen.queryByRole('button', { name: /Choose another workbook batch/i }))
          .not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Sign out' }))
        expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/unknown final server status/i))
        expect(repository.signOut).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', {
          name: `Discard failed upload for ${file.name}`,
        }))
        expect(retry).toBeInTheDocument()

        confirm.mockReturnValue(true)
        await user.click(screen.getByRole('button', {
          name: `Discard failed upload for ${file.name}`,
        }))
        await waitFor(() => expect(retry).not.toBeInTheDocument())
        expect(input).toBeEnabled()
      } finally {
        confirm.mockRestore()
      }
    })

    it('keeps successful workbook uploads when one fails and retries only that file', async () => {
      const user = userEvent.setup()
      const files = [
        workbookFile('qpt-success-one.xlsx'),
        workbookFile('qpt-failed.xlsx'),
        workbookFile('qpt-success-two.xlsx'),
      ]
      const attempts = new Map<File, number>()
      const queueWorkbook = vi.fn(async (file: File): Promise<QueuedImport> => {
        const attempt = (attempts.get(file) ?? 0) + 1
        attempts.set(file, attempt)
        if (file === files[1] && attempt === 1) {
          throw new Error('The private upload connection was interrupted.')
        }
        return {
          importId: `import-${file.name}`,
          fileName: file.name,
          state: 'queued',
        }
      })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview: vi.fn(() => new Promise<WorkbookReview>(() => undefined)),
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      fireEvent.change(input, { target: { files } })
      await user.click(screen.getByRole('button', { name: /Upload.*server validation/i }))

      await waitFor(() => expect(queueWorkbook).toHaveBeenCalledTimes(3))
      const retry = await screen.findByRole('button', {
        name: /Retry upload for qpt-failed\.xlsx/i,
      })
      expect(screen.queryByRole('button', {
        name: /Retry upload for qpt-success-one\.xlsx/i,
      })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', {
        name: /Retry upload for qpt-success-two\.xlsx/i,
      })).not.toBeInTheDocument()

      await user.click(retry)

      await waitFor(() => expect(queueWorkbook).toHaveBeenCalledTimes(4))
      expect(queueWorkbook.mock.calls.filter(([file]) => file === files[0])).toHaveLength(1)
      expect(queueWorkbook.mock.calls.filter(([file]) => file === files[1])).toHaveLength(2)
      expect(queueWorkbook.mock.calls.filter(([file]) => file === files[2])).toHaveLength(1)
      expect(queueWorkbook.mock.calls[3]?.[0]).toBe(files[1])
      await waitFor(() => expect(screen.queryByRole('button', {
        name: /Retry upload for qpt-failed\.xlsx/i,
      })).not.toBeInTheDocument())
    })

    it('never runs more than three manual workbook retries at once', async () => {
      const user = userEvent.setup()
      const files = [
        workbookFile('retry-one.xlsx'),
        workbookFile('retry-two.xlsx'),
        workbookFile('retry-three.xlsx'),
        workbookFile('retry-four.xlsx'),
      ]
      const attempts = new Map<File, number>()
      const retryGates = new Map(files.map((file) => [file, deferred<QueuedImport>()]))
      const queueWorkbook = vi.fn((file: File) => {
        const attempt = (attempts.get(file) ?? 0) + 1
        attempts.set(file, attempt)
        if (attempt === 1) return Promise.reject(new Error('Initial attempt failed.'))
        return retryGates.get(file)?.promise ?? Promise.reject(new Error('Unexpected workbook'))
      })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview: vi.fn(() => new Promise<WorkbookReview>(() => undefined)),
      })

      render(<App repository={repository} initialView="admin" />)

      fireEvent.change(await screen.findByLabelText('Choose QPT workbook'), {
        target: { files },
      })
      await user.click(screen.getByRole('button', { name: /Upload 4 workbooks/i }))
      await waitFor(() => expect(queueWorkbook).toHaveBeenCalledTimes(4))

      for (const file of files.slice(0, 3)) {
        await user.click(await screen.findByRole('button', {
          name: `Retry upload for ${file.name}`,
        }))
      }

      const fourthRetry = await screen.findByRole('button', {
        name: `Retry upload for ${files[3].name}`,
      })
      expect(fourthRetry).toBeDisabled()
      expect(queueWorkbook).toHaveBeenCalledTimes(7)

      retryGates.get(files[0])?.resolve({
        importId: 'retry-import-1',
        fileName: files[0].name,
        state: 'queued',
      })
      await waitFor(() => expect(fourthRetry).toBeEnabled())
      await user.click(fourthRetry)
      expect(queueWorkbook).toHaveBeenCalledTimes(8)

      for (const [index, file] of files.entries()) {
        if (index === 0) continue
        retryGates.get(file)?.resolve({
          importId: `retry-import-${index + 1}`,
          fileName: file.name,
          state: 'queued',
        })
      }
    })

    it('polls each queued import by ID and renders review cards with unique heading IDs', async () => {
      const user = userEvent.setup()
      const files = [
        workbookFile('qpt-eleven.xlsx'),
        workbookFile('qpt-twelve.xlsx'),
        workbookFile('qpt-thirteen.xlsx'),
      ]
      const imports = files.map((file, index) => ({
        importId: `import-${index + 11}`,
        fileName: file.name,
        state: 'queued' as const,
      }))
      const reviews = new Map(imports.map((queuedImport, index) => [
        queuedImport.importId,
        {
          ...review,
          importId: queuedImport.importId,
          fileName: queuedImport.fileName,
          assessmentCode: `QPT-${index + 11}-2026-07-15-10E`,
          displayTitle: `QPT ${index + 11}`,
          qptNumber: index + 11,
          revisionId: `revision-${index + 11}`,
        } satisfies WorkbookReview,
      ]))
      const queueWorkbook = vi.fn(async (file: File) => {
        const queuedImport = imports.find((item) => item.fileName === file.name)
        if (!queuedImport) throw new Error('Unexpected workbook')
        return queuedImport
      })
      const getImportReview = vi.fn(async (importId: string) => {
        const nextReview = reviews.get(importId)
        if (!nextReview) throw new Error('Unexpected import ID')
        return nextReview
      })
      const repository = createRepository({
        getPortalContext: vi.fn().mockResolvedValue({
          roles: ['admin'],
          mustChangePassword: false,
          students: [],
        }),
        queueWorkbook,
        getImportReview,
      })

      render(<App repository={repository} initialView="admin" />)

      const input = await screen.findByLabelText(/Choose QPT workbook/i)
      fireEvent.change(input, { target: { files } })
      await user.click(screen.getByRole('button', { name: /Upload.*server validation/i }))

      await waitFor(() => {
        expect(getImportReview).toHaveBeenCalledWith('import-11')
        expect(getImportReview).toHaveBeenCalledWith('import-12')
        expect(getImportReview).toHaveBeenCalledWith('import-13')
      })
      const headings = await Promise.all([
        screen.findByRole('heading', { name: 'QPT 11' }),
        screen.findByRole('heading', { name: 'QPT 12' }),
        screen.findByRole('heading', { name: 'QPT 13' }),
      ])
      expect(headings.every((heading) => Boolean(heading.id))).toBe(true)
      expect(new Set(headings.map((heading) => heading.id)).size).toBe(headings.length)
    })
  })

  it('lets the unified admin issue a student login and reveals the temporary password once', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([
        {
          studentId: 'student-1',
          fullName: 'Synthetic Student A',
          rollNo: '0012',
          batchCode: '10-E',
          loginId: null,
          accountStatus: 'not-provisioned',
          mustChangePassword: false,
        },
        {
          studentId: 'student-2',
          fullName: 'Suspended Student',
          rollNo: '0013',
          batchCode: '10-E',
          loginId: '0013',
          accountStatus: 'suspended',
          mustChangePassword: false,
        },
      ]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0012',
        temporaryPassword: 'TempSecure9A',
        state: 'provisioned',
      }),
    })

    render(<App repository={repository} initialView="admin" />)

    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    expect(await screen.findByRole('heading', { name: 'Student access' })).toBeVisible()
    expect(await screen.findByText('Synthetic Student A')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Account suspended for Suspended Student' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Create login for Synthetic Student A' }))

    expect(repository.issueStudentCredential).toHaveBeenCalledWith('student-1')
    expect(await screen.findByText('TempSecure9A')).toBeVisible()
    expect(screen.getByText(/shown only now/i)).toBeVisible()
  })

  it('brings a reset credential into view and labels the pending password state clearly', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    const targetAccount = {
      studentId: 'student-target',
      fullName: 'Synthetic Target Student',
      rollNo: '09999',
      batchCode: 'E-0',
      loginId: '09999',
      accountStatus: 'active' as const,
      mustChangePassword: true,
    }
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([
        ...Array.from({ length: 30 }, (_, index) => ({
          studentId: `student-${index}`,
          fullName: `Student ${index}`,
          rollNo: `10${String(index).padStart(3, '0')}`,
          batchCode: 'E-0',
          loginId: null,
          accountStatus: 'not-provisioned' as const,
          mustChangePassword: false,
        })),
        targetAccount,
      ]),
      resetStudentCredential: vi.fn().mockResolvedValue({
        studentId: targetAccount.studentId,
        loginId: targetAccount.loginId,
        temporaryPassword: 'ResetSecure9A',
        state: 'reset-required',
      }),
    })

    try {
      render(<App repository={repository} initialView="admin" />)

      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      expect(await screen.findByText('Awaiting first password change')).toBeVisible()
      expect(screen.queryByText(/^Temporary password$/)).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', {
        name: 'Issue new temporary password for Synthetic Target Student',
      }))
      expect(screen.getByText(/new temporary password.*shown only once/i)).toBeVisible()
      await user.click(screen.getByRole('button', { name: 'Issue temporary password' }))

      expect(repository.resetStudentCredential).toHaveBeenCalledWith(targetAccount.studentId)
      const credentialPanel = await screen.findByRole('status', {
        name: 'New temporary password issued',
      })
      expect(credentialPanel).toHaveFocus()
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
      expect(within(credentialPanel).getByText('ResetSecure9A')).toBeVisible()
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  it('opens an admin-only account in Admin and hides the irrelevant Results navigation', async () => {
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Admin portal' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Results' })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/admin')
  })

  it('redirects a student-only account away from Admin and shows only Results', async () => {
    window.history.replaceState({}, '', '/admin')
    render(<App repository={createRepository()} />)

    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Results' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('keeps Results and Admin available when an administrator also has a linked student', async () => {
    const user = userEvent.setup()
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [{
          id: 'student-1',
          fullName: 'Synthetic Student A',
          rollNo: '0012',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        }],
      }),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Results' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Admin' }))
    expect(await screen.findByRole('heading', { name: 'Admin portal' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Results' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')
  })

  it('uses one bulk action, confirms password replacement, and automatically downloads the complete file', async () => {
    const user = userEvent.setup()
    downloadCredentialWorkbookMock.mockResolvedValue(
      'concept-student-temporary-credentials-2026-07-15-190000.xlsx',
    )
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([
        {
          studentId: 'student-new',
          fullName: 'New Student',
          rollNo: '0020',
          batchCode: '10-E',
          loginId: null,
          accountStatus: 'not-provisioned',
          mustChangePassword: false,
        },
        {
          studentId: 'student-existing',
          fullName: 'Existing Student',
          rollNo: '0021',
          batchCode: '10-E',
          loginId: '0021',
          accountStatus: 'active',
          mustChangePassword: false,
        },
        {
          studentId: 'student-suspended',
          fullName: 'Suspended Student',
          rollNo: '0022',
          batchCode: '10-E',
          loginId: '0022',
          accountStatus: 'suspended',
          mustChangePassword: false,
        },
      ]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-new',
        loginId: '0020',
        temporaryPassword: 'NewSecure9A',
        state: 'provisioned',
      }),
      resetStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-existing',
        loginId: '0021',
        temporaryPassword: 'ResetSecure9A',
        state: 'reset-required',
      }),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    const generate = await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    })
    expect(screen.queryByRole('button', { name: /Create .* missing login/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {
      name: 'Prepare fresh credentials for all active students',
    })).not.toBeInTheDocument()
    await user.click(generate)

    expect(screen.getByRole('heading', {
      name: 'Generate a new login file for 2 students?',
    })).toBeVisible()
    const confirm = screen.getByRole('button', { name: 'Replace passwords & download Excel' })
    expect(confirm).toBeDisabled()
    expect(repository.issueStudentCredential).not.toHaveBeenCalled()
    expect(repository.resetStudentCredential).not.toHaveBeenCalled()

    await user.click(screen.getByLabelText(
      'I understand that older credential files and passwords will stop working.',
    ))
    await user.click(confirm)

    await waitFor(() => expect(repository.issueStudentCredential).toHaveBeenCalledWith('student-new'))
    await waitFor(() => expect(repository.resetStudentCredential).toHaveBeenCalledWith('student-existing'))
    expect(repository.resetStudentCredential).not.toHaveBeenCalledWith('student-suspended')
    await waitFor(() => expect(downloadCredentialWorkbookMock).toHaveBeenCalledOnce())
    const [rows] = downloadCredentialWorkbookMock.mock.calls[0]
    expect(rows).toEqual([
      expect.objectContaining({
        studentName: 'New Student',
        rollNumber: '0020',
        loginId: '0020',
        temporaryPassword: 'NewSecure9A',
        action: 'created',
      }),
      expect.objectContaining({
        studentName: 'Existing Student',
        rollNumber: '0021',
        loginId: '0021',
        temporaryPassword: 'ResetSecure9A',
        action: 'reset',
      }),
    ])
    expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Download Excel again' })).toBeVisible()
  })

  it('processes at most six student accounts concurrently and preserves roster order', async () => {
    const user = userEvent.setup()
    downloadCredentialWorkbookMock.mockResolvedValue('credentials.xlsx')
    const accounts = Array.from({ length: 8 }, (_, index) => ({
      studentId: `student-${index + 1}`,
      fullName: `Student ${index + 1}`,
      rollNo: String(index + 1).padStart(4, '0'),
      batchCode: '10-E',
      loginId: null,
      accountStatus: 'not-provisioned' as const,
      mustChangePassword: false,
    }))
    const gates = accounts.map(() => {
      let resolve!: (value: {
        studentId: string
        loginId: string
        temporaryPassword: string
        state: 'provisioned'
      }) => void
      const promise = new Promise<{
        studentId: string
        loginId: string
        temporaryPassword: string
        state: 'provisioned'
      }>((settle) => { resolve = settle })
      return { promise, resolve }
    })
    let active = 0
    let maximumActive = 0
    const issueStudentCredential = vi.fn((studentId: string) => {
      const index = accounts.findIndex((account) => account.studentId === studentId)
      active += 1
      maximumActive = Math.max(maximumActive, active)
      return gates[index].promise.finally(() => { active -= 1 })
    })
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue(accounts),
      issueStudentCredential,
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    }))

    await waitFor(() => expect(issueStudentCredential).toHaveBeenCalledTimes(6))
    expect(maximumActive).toBe(6)
    gates[0].resolve({
      studentId: accounts[0].studentId,
      loginId: accounts[0].rollNo,
      temporaryPassword: 'Password1SecureA',
      state: 'provisioned',
    })
    await waitFor(() => expect(issueStudentCredential).toHaveBeenCalledTimes(7))
    gates[1].resolve({
      studentId: accounts[1].studentId,
      loginId: accounts[1].rollNo,
      temporaryPassword: 'Password2SecureA',
      state: 'provisioned',
    })
    await waitFor(() => expect(issueStudentCredential).toHaveBeenCalledTimes(8))
    for (let index = 2; index < gates.length; index += 1) {
      gates[index].resolve({
        studentId: accounts[index].studentId,
        loginId: accounts[index].rollNo,
        temporaryPassword: `Password${index + 1}SecureA`,
        state: 'provisioned',
      })
    }

    await waitFor(() => expect(downloadCredentialWorkbookMock).toHaveBeenCalledOnce())
    expect(maximumActive).toBe(6)
    expect(issueStudentCredential).toHaveBeenCalledTimes(8)
    const [rows] = downloadCredentialWorkbookMock.mock.calls[0]
    expect(rows.map((row) => row.rollNumber)).toEqual(accounts.map((account) => account.rollNo))
  })

  it('does not call an incomplete credential set a complete download', async () => {
    const user = userEvent.setup()
    const accounts = ['First', 'Failed', 'Third'].map((name, index) => ({
      studentId: `student-${index + 1}`,
      fullName: `${name} Student`,
      rollNo: String(index + 31).padStart(4, '0'),
      batchCode: '10-E',
      loginId: null,
      accountStatus: 'not-provisioned' as const,
      mustChangePassword: false,
    }))
    const issueStudentCredential = vi.fn(async (studentId: string) => {
      const account = accounts.find((candidate) => candidate.studentId === studentId)!
      if (studentId === 'student-2') throw new Error('Synthetic failure')
      return {
        studentId,
        loginId: account.rollNo,
        temporaryPassword: `Private${account.rollNo}SecureA`,
        state: 'provisioned' as const,
      }
    })
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue(accounts),
      issueStudentCredential,
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    }))

    expect(await screen.findByRole('heading', { name: 'Credential file incomplete' })).toBeVisible()
    expect(screen.getAllByText(/2 of 3 credentials are ready/i)).toHaveLength(2)
    const failureAlert = screen.getByRole('alert')
    expect(within(failureAlert).getByText('Failed Student')).toBeVisible()
    expect(failureAlert).toHaveTextContent('Roll 0032 · Batch 10-E · Account update failed')
    expect(failureAlert).not.toHaveTextContent('Synthetic failure')
    expect(downloadCredentialWorkbookMock).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Download 2 successful credentials' }))
    await waitFor(() => expect(downloadCredentialWorkbookMock).toHaveBeenCalledOnce())
  })

  it('keeps generated credentials recoverable when the automatic Excel download fails', async () => {
    const user = userEvent.setup()
    downloadCredentialWorkbookMock
      .mockRejectedValueOnce(new Error('Synthetic browser download failure'))
      .mockResolvedValueOnce('credentials.xlsx')
    const account = {
      studentId: 'student-1',
      fullName: 'First Student',
      rollNo: '0031',
      batchCode: '10-E',
      loginId: null,
      accountStatus: 'not-provisioned' as const,
      mustChangePassword: false,
    }
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([account]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: account.studentId,
        loginId: account.rollNo,
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      }),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    }))

    expect(await screen.findByRole('heading', { name: 'Credential file ready' })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(/Excel download could not be started/i)
    await user.click(screen.getByRole('button', { name: 'Download credentials Excel' }))
    await waitFor(() => expect(downloadCredentialWorkbookMock).toHaveBeenCalledTimes(2))
    expect(repository.issueStudentCredential).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()
  })

  it('prevents sign-out while a credential batch is still changing accounts', async () => {
    const user = userEvent.setup()
    let resolveCredential!: (value: {
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'provisioned'
    }) => void
    const pendingCredential = new Promise<{
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'provisioned'
    }>((resolve) => { resolveCredential = resolve })
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [{
          id: 'linked-student',
          fullName: 'Linked Student',
          rollNo: '0099',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        }],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockReturnValue(pendingCredential),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    }))

    await waitFor(() => expect(repository.issueStudentCredential).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Results' })).toBeDisabled()
    expect(repository.signOut).not.toHaveBeenCalled()

    resolveCredential({
      studentId: 'student-1',
      loginId: '0031',
      temporaryPassword: 'Private0031SecureA',
      state: 'provisioned',
    })
    expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Results' })).toBeEnabled()
  })

  it('prevents sign-out while an individual credential reset is still running', async () => {
    const user = userEvent.setup()
    let resolveCredential!: (value: {
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'reset-required'
    }) => void
    const pendingCredential = new Promise<{
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'reset-required'
    }>((resolve) => { resolveCredential = resolve })
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: '0031',
        accountStatus: 'active',
        mustChangePassword: false,
      }]),
      resetStudentCredential: vi.fn().mockReturnValue(pendingCredential),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Issue new temporary password for First Student',
    }))
    await user.click(screen.getByRole('button', { name: 'Issue temporary password' }))

    await waitFor(() => expect(repository.resetStudentCredential).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()

    resolveCredential({
      studentId: 'student-1',
      loginId: '0031',
      temporaryPassword: 'Private0031SecureA',
      state: 'reset-required',
    })
    expect(await screen.findByRole('status', { name: 'New temporary password issued' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
  })

  it('confirms before sign-out discards generated credentials held in page memory', async () => {
    const user = userEvent.setup()
    const confirmDiscard = vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      }),
    })

    try {
      render(<App repository={repository} initialView="admin" />)
      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      await user.click(await screen.findByRole('button', {
        name: 'Generate & download all credentials',
      }))
      expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Sign out' }))
      expect(confirmDiscard).toHaveBeenCalledOnce()
      expect(repository.signOut).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: 'Sign out' }))
      await waitFor(() => expect(repository.signOut).toHaveBeenCalledOnce())
      expect(confirmDiscard).toHaveBeenCalledTimes(2)
      expect(await screen.findByRole('heading', { name: 'Student sign in' })).toBeVisible()
    } finally {
      confirmDiscard.mockRestore()
    }
  })

  it('confirms before navigation discards generated credentials held in page memory', async () => {
    const user = userEvent.setup()
    const confirmDiscard = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [{
          id: 'linked-student',
          fullName: 'Linked Student',
          rollNo: '0099',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        }],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      }),
    })

    try {
      render(<App repository={repository} initialView="admin" />)
      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      await user.click(await screen.findByRole('button', {
        name: 'Generate & download all credentials',
      }))
      expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Results' }))
      expect(confirmDiscard).toHaveBeenCalledOnce()
      expect(screen.getByRole('heading', { name: 'Admin portal' })).toBeVisible()

      await user.click(screen.getByRole('button', {
        name: 'I saved the file — clear credentials from this page',
      }))
      await user.click(screen.getByRole('button', { name: 'Results' }))
      expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
      expect(confirmDiscard).toHaveBeenCalledOnce()
    } finally {
      confirmDiscard.mockRestore()
    }
  })

  it('protects an active or unsaved credential run from browser Back navigation', async () => {
    window.history.replaceState({}, '', '/admin')
    const user = userEvent.setup()
    let resolveCredential!: (value: {
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'provisioned'
    }) => void
    const pendingCredential = new Promise<{
      studentId: string
      loginId: string
      temporaryPassword: string
      state: 'provisioned'
    }>((resolve) => { resolveCredential = resolve })
    const confirmDiscard = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [{
          id: 'linked-student',
          fullName: 'Linked Student',
          rollNo: '0099',
          batchCode: '10-E',
          batchName: 'Class 10 Evening',
        }],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockReturnValue(pendingCredential),
    })

    try {
      render(<App repository={repository} />)
      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      await user.click(await screen.findByRole('button', {
        name: 'Generate & download all credentials',
      }))
      await waitFor(() => expect(repository.issueStudentCredential).toHaveBeenCalledOnce())

      act(() => {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(window.location.pathname).toBe('/admin')
      expect(screen.getByRole('heading', { name: 'Admin portal' })).toBeVisible()
      expect(confirmDiscard).not.toHaveBeenCalled()

      resolveCredential({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      })
      expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()

      act(() => {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(confirmDiscard).toHaveBeenCalledOnce()
      expect(window.location.pathname).toBe('/admin')
      expect(screen.getByRole('heading', { name: 'Admin portal' })).toBeVisible()

      await user.click(screen.getByRole('button', {
        name: 'I saved the file — clear credentials from this page',
      }))
      act(() => {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()
      expect(confirmDiscard).toHaveBeenCalledOnce()
    } finally {
      confirmDiscard.mockRestore()
    }
  })

  it('clears every in-memory copy of an individually issued credential', async () => {
    const user = userEvent.setup()
    const confirmDiscard = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: '0031',
        accountStatus: 'active',
        mustChangePassword: false,
      }]),
      resetStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'reset-required',
      }),
    })

    try {
      render(<App repository={repository} initialView="admin" />)
      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      await user.click(await screen.findByRole('button', {
        name: 'Issue new temporary password for First Student',
      }))
      await user.click(screen.getByRole('button', { name: 'Issue temporary password' }))

      expect(await screen.findByText('Private0031SecureA')).toBeVisible()
      expect(screen.getByRole('heading', { name: 'Credential file ready' })).toBeVisible()
      await user.click(screen.getByRole('button', {
        name: 'I saved the file — clear credentials from this page',
      }))

      expect(screen.queryByText('Private0031SecureA')).not.toBeInTheDocument()
      expect(screen.queryByRole('status', { name: 'New temporary password issued' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Credential file ready' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Sign out' }))
      await waitFor(() => expect(repository.signOut).toHaveBeenCalledOnce())
      expect(confirmDiscard).not.toHaveBeenCalled()
    } finally {
      confirmDiscard.mockRestore()
    }
  })

  it('blocks regeneration until the prior in-memory credential set is explicitly cleared', async () => {
    const user = userEvent.setup()
    downloadCredentialWorkbookMock.mockRejectedValueOnce(new Error('Synthetic download failure'))
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      }),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    const generate = await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    })
    await user.click(generate)
    expect(await screen.findByRole('heading', { name: 'Credential file ready' })).toBeVisible()
    expect(generate).toBeDisabled()

    await user.click(screen.getByRole('button', {
      name: 'I saved the file — clear credentials from this page',
    }))
    await waitFor(() => expect(screen.getByRole('button', {
      name: 'Generate & download all credentials',
    })).toBeEnabled())
    expect(repository.issueStudentCredential).toHaveBeenCalledOnce()
  })

  it('blocks a batch when two student rows share one existing login', async () => {
    const user = userEvent.setup()
    const accounts = ['student-1', 'student-2'].map((studentId, index) => ({
      studentId,
      fullName: `Student ${index + 1}`,
      rollNo: `004${index}`,
      batchCode: '10-E',
      loginId: 'shared-login',
      accountStatus: 'active' as const,
      mustChangePassword: false,
    }))
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue(accounts),
    })

    render(<App repository={repository} initialView="admin" />)
    await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
    await user.click(await screen.findByRole('button', {
      name: 'Generate & download all credentials',
    }))
    await user.click(screen.getByLabelText(
      'I understand that older credential files and passwords will stop working.',
    ))
    await user.click(screen.getByRole('button', { name: 'Replace passwords & download Excel' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/duplicate login/i)
    expect(repository.issueStudentCredential).not.toHaveBeenCalled()
    expect(repository.resetStudentCredential).not.toHaveBeenCalled()
    expect(downloadCredentialWorkbookMock).not.toHaveBeenCalled()
  })

  it('signs a shared-device session out after the idle limit', async () => {
    vi.useFakeTimers()
    const repository = createRepository()

    try {
      render(<App repository={repository} />)
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_IDLE_TIMEOUT_MS)
      })

      expect(repository.signOut).toHaveBeenCalledOnce()
      expect(screen.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('hides private UI immediately when an idle network sign-out never settles', async () => {
    vi.useFakeTimers()
    const repository = createRepository({
      signOut: vi.fn().mockReturnValue(new Promise<void>(() => undefined)),
    })

    try {
      render(<App repository={repository} />)
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_IDLE_TIMEOUT_MS)
      })

      expect(repository.signOut).toHaveBeenCalledOnce()
      expect(screen.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a persisted session that was already idle before the page reloaded', async () => {
    window.localStorage.setItem(
      `concept-qpt:last-activity:${session.userId}`,
      String(Date.now() - PORTAL_IDLE_TIMEOUT_MS - 1),
    )
    const repository = createRepository()

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Student sign in' })).toBeVisible()
    expect(repository.signOut).toHaveBeenCalledOnce()
    expect(repository.getPortalContext).not.toHaveBeenCalled()
  })

  it('fails closed for a persisted session with no verifiable activity marker', async () => {
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue(session),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Student sign in' })).toBeVisible()
    expect(repository.signOut).toHaveBeenCalledOnce()
    expect(repository.getPortalContext).not.toHaveBeenCalled()
  })

  it('fails closed when another tab broadcasts a sign-out', async () => {
    const repository = createRepository()
    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Your QPT results' })).toBeVisible()

    window.dispatchEvent(new StorageEvent('storage', {
      key: `concept-qpt:sign-out:${session.userId}`,
      newValue: String(Date.now()),
      storageArea: window.localStorage,
    }))

    await waitFor(() => expect(repository.signOut).toHaveBeenCalledOnce())
    expect(screen.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
  })

  it('uses a newer activity timestamp from another tab when scheduling expiry', async () => {
    vi.useFakeTimers()
    const repository = createRepository()

    try {
      render(<App repository={repository} />)
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_IDLE_TIMEOUT_MS - 1_000)
      })
      window.dispatchEvent(new StorageEvent('storage', {
        key: `concept-qpt:last-activity:${session.userId}`,
        newValue: String(Date.now()),
        storageArea: window.localStorage,
      }))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_001)
      })
      expect(repository.signOut).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_IDLE_TIMEOUT_MS - 1_001)
      })
      expect(repository.signOut).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('recovers automatically when an import review poll fails transiently', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['uploader'],
        mustChangePassword: false,
        students: [],
      }),
      getImportReview: vi
        .fn()
        .mockRejectedValueOnce(new Error('temporary network failure'))
        .mockResolvedValue(review),
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    try {
      render(<App repository={repository} initialView="admin" />)
      const file = new File(['workbook'], 'qpt-5.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      await user.upload(await screen.findByLabelText('Choose QPT workbook'), file)
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The latest server validation status could not be loaded.',
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000)
      })

      expect(await screen.findByRole('heading', { name: 'QPT 5' })).toBeVisible()
      expect(repository.getImportReview).toHaveBeenCalledTimes(2)
      expect(screen.queryByText(/validation status could not be loaded/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('offers an immediate manual retry after automatic review retries are exhausted', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const getImportReview = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValue(review)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['uploader'],
        mustChangePassword: false,
        students: [],
      }),
      getImportReview,
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    try {
      render(<App repository={repository} initialView="admin" />)
      const file = new File(['workbook'], 'qpt-5.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      await user.upload(await screen.findByLabelText('Choose QPT workbook'), file)
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000 + 4_000 + 6_000)
      })
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Retry when the connection is available.',
      )
      expect(getImportReview).toHaveBeenCalledTimes(4)

      await user.click(screen.getByRole('button', {
        name: 'Retry validation status for qpt-5.xlsx',
      }))

      expect(await screen.findByRole('heading', { name: 'QPT 5' })).toBeVisible()
      expect(getImportReview).toHaveBeenCalledTimes(5)
    } finally {
      vi.useRealTimers()
    }
  })

  it('protects an exhausted review poll until the admin retries or explicitly stops tracking it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const getImportReview = vi.fn().mockRejectedValue(new Error('network unavailable'))
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['uploader'],
        mustChangePassword: false,
        students: [],
      }),
      getImportReview,
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    try {
      render(<App repository={repository} initialView="admin" />)
      const input = await screen.findByLabelText('Choose QPT workbook')
      await user.upload(input, workbookFile('qpt-review-unknown.xlsx'))
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000 + 4_000 + 6_000)
      })

      const stopTracking = await screen.findByRole('button', {
        name: 'Stop tracking validation for qpt-review-unknown.xlsx',
      })
      expect(input).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()

      await user.click(stopTracking)
      expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/discard its import reference/i))
      expect(stopTracking).toBeInTheDocument()

      confirm.mockReturnValue(true)
      await user.click(stopTracking)
      await waitFor(() => expect(stopTracking).not.toBeInTheDocument())
      expect(input).toBeEnabled()
    } finally {
      confirm.mockRestore()
      vi.useRealTimers()
    }
  })

  it('stops polling a perpetually processing review at the overall deadline', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const getImportReview = vi.fn().mockResolvedValue({
      ...review,
      state: 'processing',
    } satisfies WorkbookReview)
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['uploader'],
        mustChangePassword: false,
        students: [],
      }),
      getImportReview,
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    try {
      render(<App repository={repository} initialView="admin" />)
      const file = workbookFile('qpt-processing-forever.xlsx')
      await user.upload(await screen.findByLabelText('Choose QPT workbook'), file)
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(WORKBOOK_REVIEW_DEADLINE_MS)
      })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /validation is taking longer than expected/i,
      )
      expect(screen.getByRole('button', {
        name: `Stop tracking validation for ${file.name}`,
      })).toBeVisible()
      expect(getImportReview.mock.calls.length).toBeGreaterThan(1)
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('warns about both credential recovery data and an unresolved workbook review', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    downloadCredentialWorkbookMock.mockResolvedValue('credentials.xlsx')
    const repository = createRepository({
      getPortalContext: vi.fn().mockResolvedValue({
        roles: ['admin'],
        mustChangePassword: false,
        students: [],
      }),
      getStudentAccounts: vi.fn().mockResolvedValue([{
        studentId: 'student-1',
        fullName: 'First Student',
        rollNo: '0031',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      }]),
      issueStudentCredential: vi.fn().mockResolvedValue({
        studentId: 'student-1',
        loginId: '0031',
        temporaryPassword: 'Private0031SecureA',
        state: 'provisioned',
      }),
      getImportReview: vi.fn().mockRejectedValue(new Error('network unavailable')),
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    try {
      render(<App repository={repository} initialView="admin" />)
      await user.click(await screen.findByRole('tab', { name: 'Student Access' }))
      await user.click(await screen.findByRole('button', {
        name: 'Generate & download all credentials',
      }))
      expect(await screen.findByRole('heading', { name: 'Download started' })).toBeVisible()

      await user.click(screen.getByRole('tab', { name: 'Workbooks' }))
      await user.upload(
        screen.getByLabelText('Choose QPT workbook'),
        workbookFile('qpt-combined-protection.xlsx'),
      )
      await user.click(screen.getByRole('button', { name: 'Upload for server validation' }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000 + 4_000 + 6_000)
      })

      await screen.findByRole('button', {
        name: 'Stop tracking validation for qpt-combined-protection.xlsx',
      })
      await user.click(screen.getByRole('button', { name: 'Sign out' }))

      expect(confirm).toHaveBeenCalledWith(expect.stringMatching(
        /Temporary credentials.*workbook upload.*discard both recovery copies/i,
      ))
      expect(repository.signOut).not.toHaveBeenCalled()
    } finally {
      confirm.mockRestore()
      vi.useRealTimers()
    }
  })

  it('shows a clear empty state when no results have been published', async () => {
    const repository = createRepository({
      getStudentResults: vi.fn().mockResolvedValue([]),
    })

    render(<App repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'No published results yet' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
