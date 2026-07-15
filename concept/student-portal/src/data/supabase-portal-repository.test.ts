import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../lib/database.types'
import { createPortalRepository } from './supabase-portal-repository'

function clientWithRpc(
  rpc: ReturnType<typeof vi.fn>,
  upload = vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
  invoke = vi.fn().mockResolvedValue({ data: { accepted: true }, error: null }),
) {
  const from = vi.fn().mockReturnValue({ upload })
  const client = {
    schema: vi.fn().mockReturnValue({ rpc }),
    storage: { from },
    functions: { invoke },
  } as unknown as SupabaseClient<Database>
  return { client, from, upload, invoke }
}

describe('Supabase portal repository', () => {
  it('signs in with a roll/login ID while keeping the internal email out of the session UI', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'student-user-1',
            email: 'student.0012@login.concept.invalid',
            user_metadata: { login_id: '0012' },
          },
        },
      },
      error: null,
    })
    const client = {
      auth: { signInWithPassword },
    } as unknown as SupabaseClient<Database>
    const repository = createPortalRepository(client)

    await expect(repository.signIn('  0012  ', 'SecurePass9')).resolves.toEqual({
      userId: 'student-user-1',
      accountLabel: '0012',
    })
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'student.0012@login.concept.invalid',
      password: 'SecurePass9',
    })
  })

  it('rejects an invalid roll/login ID before calling Supabase Auth', async () => {
    const signInWithPassword = vi.fn()
    const client = {
      auth: { signInWithPassword },
    } as unknown as SupabaseClient<Database>
    const repository = createPortalRepository(client)

    await expect(repository.signIn('student@example.com', 'SecurePass9')).rejects.toThrow(
      'valid roll number',
    )
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('changes an initial temporary password through the authenticated server function', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { changed: true }, error: null })
    const client = {
      functions: { invoke },
    } as unknown as SupabaseClient<Database>
    const repository = createPortalRepository(client)

    await repository.changeInitialPassword('NewSecurePass9')

    expect(invoke).toHaveBeenCalledWith('student-account', {
      body: { action: 'change-initial-password', newPassword: 'NewSecurePass9' },
    })
  })

  it('can discard a server-invalidated browser session without another network request', () => {
    window.localStorage.setItem('concept-qpt:supabase-auth', 'expired-session')
    window.localStorage.setItem('concept-qpt:supabase-auth-code-verifier', 'expired-verifier')
    const repository = createPortalRepository(null)

    repository.discardLocalSession()

    expect(window.localStorage.getItem('concept-qpt:supabase-auth')).toBeNull()
    expect(window.localStorage.getItem('concept-qpt:supabase-auth-code-verifier')).toBeNull()
  })

  it('loads student login states through the authenticated admin function', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        accounts: [
          {
            student_id: 'student-1',
            full_name: 'Synthetic Student A',
            roll_no: '0012',
            batch_code: '10-E',
            login_id: null,
            account_status: null,
            must_change_password: false,
          },
        ],
      },
      error: null,
    })
    const client = { functions: { invoke } } as unknown as SupabaseClient<Database>
    const repository = createPortalRepository(client)

    await expect(repository.getStudentAccounts()).resolves.toEqual([
      {
        studentId: 'student-1',
        fullName: 'Synthetic Student A',
        rollNo: '0012',
        batchCode: '10-E',
        loginId: null,
        accountStatus: 'not-provisioned',
        mustChangePassword: false,
      },
    ])
    expect(invoke).toHaveBeenCalledWith('student-account', { body: { action: 'list' } })
  })

  it('provisions and resets student credentials without exposing the internal Auth email', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          action: 'provision',
          state: 'provisioned',
          studentId: 'student-1',
          loginId: '0012',
          temporaryPassword: 'TempSecure9A',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          action: 'reset',
          state: 'reset-required',
          studentId: 'student-1',
          loginId: '0012',
          temporaryPassword: 'ResetSecure9A',
        },
        error: null,
      })
    const client = { functions: { invoke } } as unknown as SupabaseClient<Database>
    const repository = createPortalRepository(client)

    await expect(repository.issueStudentCredential('student-1')).resolves.toMatchObject({
      loginId: '0012',
      temporaryPassword: 'TempSecure9A',
      state: 'provisioned',
    })
    await expect(repository.resetStudentCredential('student-1')).resolves.toMatchObject({
      loginId: '0012',
      temporaryPassword: 'ResetSecure9A',
      state: 'reset-required',
    })
    expect(invoke).toHaveBeenNthCalledWith(1, 'student-account', {
      body: { action: 'provision', studentId: 'student-1' },
    })
    expect(invoke).toHaveBeenNthCalledWith(2, 'student-account', {
      body: { action: 'reset', studentId: 'student-1' },
    })
    expect(JSON.stringify(invoke.mock.calls)).not.toContain('@login.concept.invalid')
  })

  it('uses the asynchronous private upload contract without browser-side parsing', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === 'begin_import') {
        return Promise.resolve({
          data: [
            {
              import_id: 'import-1',
              storage_bucket: 'qpt-imports',
              storage_path: 'user-1/import-1.xlsx',
            },
          ],
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { client, from, upload, invoke } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)
    const file = new File(['xlsx-bytes'], 'qpt-5.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const queued = await repository.queueWorkbook(file)

    expect(queued).toEqual({
      importId: 'import-1',
      fileName: 'qpt-5.xlsx',
      state: 'queued',
    })
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'begin_import',
      expect.objectContaining({
        p_original_filename: 'qpt-5.xlsx',
        p_byte_size: file.size,
        p_client_request_id: expect.any(String),
      }),
    )
    expect(from).toHaveBeenCalledWith('qpt-imports')
    expect(upload).toHaveBeenCalledWith(
      'user-1/import-1.xlsx',
      file,
      expect.objectContaining({ upsert: false }),
    )
    expect(rpc).toHaveBeenNthCalledWith(2, 'confirm_import_upload', {
      p_import_id: 'import-1',
    })
    expect(invoke).toHaveBeenCalledWith('parse-result-xlsx', {
      body: { importId: 'import-1' },
    })
    expect(rpc.mock.invocationCallOrder[1]).toBeLessThan(invoke.mock.invocationCallOrder[0])
  })

  it('reuses an import request id and resumes after an already-uploaded retry', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === 'begin_import') {
        return Promise.resolve({
          data: [{
            import_id: 'import-retry',
            storage_bucket: 'qpt-imports',
            storage_path: 'user-1/import-retry.xlsx',
          }],
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ data: { path: 'user-1/import-retry.xlsx' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { statusCode: '409', message: 'The resource already exists' },
      })
    const { client, invoke } = clientWithRpc(rpc, upload)
    const repository = createPortalRepository(client)
    const file = new File(['same-xlsx'], 'qpt-retry.xlsx')

    await repository.queueWorkbook(file)
    await repository.queueWorkbook(file)

    const beginCalls = rpc.mock.calls.filter(([name]) => name === 'begin_import')
    expect(beginCalls).toHaveLength(2)
    expect(beginCalls[0]?.[1].p_client_request_id).toBe(
      beginCalls[1]?.[1].p_client_request_id,
    )
    expect(upload).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls.filter(([name]) => name === 'confirm_import_upload')).toHaveLength(2)
    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it('resumes a terminal import when cleanup completed but the response was lost', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === 'begin_import') {
        return Promise.resolve({
          data: [{
            import_id: 'import-terminal',
            storage_bucket: 'qpt-imports',
            storage_path: 'user-1/import-terminal.xlsx',
          }],
          error: null,
        })
      }
      if (name === 'import_review') {
        return Promise.resolve({
          data: [{ import_id: 'import-terminal', status: 'staged' }],
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: { statusCode: '403', message: 'Storage insert is no longer allowed' },
    })
    const { client, invoke } = clientWithRpc(rpc, upload)
    const repository = createPortalRepository(client)
    const file = new File(['same-xlsx'], 'qpt-terminal.xlsx')

    await expect(repository.queueWorkbook(file)).resolves.toEqual({
      importId: 'import-terminal',
      fileName: 'qpt-terminal.xlsx',
      state: 'queued',
    })
    expect(rpc).toHaveBeenCalledWith('import_review', {
      p_import_id: 'import-terminal',
    })
    expect(rpc.mock.calls.some(([name]) => name === 'confirm_import_upload')).toBe(false)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('resumes an uploaded import after an origin rejection left the object in storage', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === 'begin_import') {
        return Promise.resolve({
          data: [{
            import_id: 'import-uploaded',
            storage_bucket: 'qpt-imports',
            storage_path: 'user-1/import-uploaded.xlsx',
          }],
          error: null,
        })
      }
      if (name === 'import_review') {
        return Promise.resolve({
          data: [{ import_id: 'import-uploaded', status: 'uploaded' }],
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const upload = vi.fn().mockResolvedValue({
      data: null,
      error: {
        statusCode: '403',
        message: 'new row violates row-level security policy',
      },
    })
    const { client, invoke } = clientWithRpc(rpc, upload)
    const repository = createPortalRepository(client)
    const file = new File(['same-xlsx'], 'qpt-uploaded.xlsx')

    await expect(repository.queueWorkbook(file)).resolves.toEqual({
      importId: 'import-uploaded',
      fileName: 'qpt-uploaded.xlsx',
      state: 'queued',
    })
    expect(rpc).toHaveBeenCalledWith('import_review', {
      p_import_id: 'import-uploaded',
    })
    expect(rpc).toHaveBeenCalledWith('confirm_import_upload', {
      p_import_id: 'import-uploaded',
    })
    expect(invoke).toHaveBeenCalledWith('parse-result-xlsx', {
      body: { importId: 'import-uploaded' },
    })
  })

  it('maps a quarantined server review to a rejected, safe correction state', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          import_id: 'import-2',
          original_filename: 'qpt-invalid.xlsx',
          status: 'quarantined',
          parser_version: 'legacy-sheet1-v1',
          row_count: 30,
          preview_metadata: {
            assessment_code: 'QPT-7',
            display_title: 'QPT 7',
            qpt_number: 7,
            test_date: '2026-07-13',
            academic_year: '2026-27',
            batch_code: '10-E',
          },
          validation_summary: {
            student_count: 10,
            subjects: [
              { subject_code: 'PHY', row_count: 10, max_marks: '100' },
            ],
            warnings: [{ code: 'name_review', message: 'Review one student name.' }],
          },
          error_summary: {
            issues: [
              {
                code: 'total_mismatch',
                message: 'A displayed total does not match the subject scores.',
                sheet: 'Sheet1',
                row: 8,
              },
            ],
          },
          requires_corrected_reupload: true,
          revision_id: null,
        },
      ],
      error: null,
    })
    const { client } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)

    const review = await repository.getImportReview('import-2')

    expect(review).toMatchObject({
      state: 'rejected',
      format: 'legacy',
      displayTitle: 'QPT 7',
      studentCount: 10,
      blockingIssues: [
        {
          code: 'total_mismatch',
          message: 'A displayed total does not match the subject scores.',
          sheet: 'Sheet1',
          row: 8,
        },
      ],
    })
    expect(rpc).toHaveBeenCalledWith('import_review', { p_import_id: 'import-2' })
  })

  it('labels a normalized duplicate as already imported instead of publishable', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          import_id: 'import-duplicate',
          original_filename: 'qpt-copy.xlsx',
          status: 'duplicate',
          parser_version: 'canonical-v1',
          row_count: 20,
          preview_metadata: {
            assessment_code: 'QPT-4-MATHS',
            display_title: 'QPT 4 Maths',
            qpt_number: 4,
            test_date: '2026-07-14',
            academic_year: '2026-27',
            batch_code: '10-E',
          },
          validation_summary: {
            student_count: 20,
            subjects: [{ code: 'MATHS', row_count: 20, max_marks: '100' }],
          },
          duplicate_of_import_id: 'import-original',
          revision_id: null,
        },
      ],
      error: null,
    })
    const { client } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)

    await expect(repository.getImportReview('import-duplicate')).resolves.toMatchObject({
      state: 'duplicate',
      revisionId: null,
      blockingIssues: [],
    })
  })

  it('uses the generated p-prefixed RPC arguments for results and publication', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === 'student_results') return Promise.resolve({ data: [], error: null })
      return Promise.resolve({ data: null, error: null })
    })
    const { client } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)

    await repository.getStudentResults('student-7')
    await repository.publishRevision('revision-3', 'revision-2')

    expect(rpc).toHaveBeenCalledWith('student_results', {
      p_student_id: 'student-7',
    })
    expect(rpc).toHaveBeenCalledWith('publish_revision', {
      p_revision_id: 'revision-3',
      p_expected_active_revision_id: 'revision-2',
    })
  })

  it('maps per-QPT insight rows and preserves nullable scores', async () => {
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name !== 'student_result_insights') {
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({
        data: [
          {
            assessment_id: 'assessment-7',
            qpt_number: 7,
            display_title: 'QPT 7',
            test_date: '2026-07-14',
            subject_code: 'SCI',
            subject_name: 'Science',
            max_marks: 40,
            student_score: 34.5,
            status: 'present',
            rank: 3,
            cohort_highest_score: 39,
            cohort_average_score: 28.75,
            participant_count: 51,
          },
          {
            assessment_id: 'assessment-7',
            qpt_number: '7',
            display_title: 'QPT 7',
            test_date: '2026-07-14',
            subject_code: 'MATH',
            subject_name: 'Mathematics',
            max_marks: '40.00',
            student_score: null,
            status: 'absent',
            rank: null,
            cohort_highest_score: null,
            cohort_average_score: null,
            participant_count: '49',
          },
        ],
        error: null,
      })
    })
    const { client } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)

    await expect(repository.getStudentQptInsights('student-7')).resolves.toEqual([
      {
        assessmentId: 'assessment-7',
        qptNumber: 7,
        displayTitle: 'QPT 7',
        testDate: '2026-07-14',
        subjectCode: 'SCI',
        subjectName: 'Science',
        maxMarks: '40',
        studentScore: '34.5',
        status: 'present',
        rank: 3,
        highestScore: '39',
        averageScore: '28.75',
        participantCount: 51,
      },
      {
        assessmentId: 'assessment-7',
        qptNumber: 7,
        displayTitle: 'QPT 7',
        testDate: '2026-07-14',
        subjectCode: 'MATH',
        subjectName: 'Mathematics',
        maxMarks: '40.00',
        studentScore: null,
        status: 'absent',
        rank: null,
        highestScore: null,
        averageScore: null,
        participantCount: 49,
      },
    ])
    expect(rpc).toHaveBeenCalledWith('student_result_insights', {
      p_student_id: 'student-7',
    })
  })

  it('never exposes a pending revision uploader UUID as a display label', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        revision_id: 'revision-4',
        assessment_code: 'QPT-4',
        display_title: 'QPT 4',
        batch_code: '10-E',
        test_date: '2026-07-14',
        row_count: 30,
        staged_at: '2026-07-14T10:00:00Z',
        uploader_id: '86fc0a83-1432-4525-9e8c-8dcbfd5dd59b',
        active_revision_id: 'revision-3',
        revision_number: 4,
        is_latest_revision: true,
        subject_summaries: [
          { subject_code: 'PHY', row_count: 10, max_marks: '100' },
          { subject_code: 'CHEM', row_count: 10, max_marks: '100' },
        ],
        status_counts: { present: 18, absent: 2 },
        warnings: [
          { code: 'name_review', message: 'Review one student name.', row: 8 },
        ],
        can_publish: true,
      }],
      error: null,
    })
    const { client } = clientWithRpc(rpc)
    const repository = createPortalRepository(client)

    const [revision] = await repository.getPendingRevisions()

    expect(revision?.uploadedByLabel).toBe('the authorised admin workflow')
    expect(revision?.uploadedByLabel).not.toContain('86fc0a83')
    expect(revision).toMatchObject({
      activeRevisionId: 'revision-3',
      revisionNumber: 4,
      isLatestRevision: true,
      subjects: [
        { code: 'PHY', rowCount: 10, maximumMarks: '100' },
        { code: 'CHEM', rowCount: 10, maximumMarks: '100' },
      ],
      statusCounts: { present: 18, absent: 2 },
      warnings: [
        { code: 'name_review', message: 'Review one student name.', row: 8 },
      ],
    })
  })
})
