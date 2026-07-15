import { describe, expect, it, vi } from 'vitest'
import type { PreparedQptImport } from '../../src/domain/qpt/prepare-import'
import { WorkbookValidationError } from '../../src/domain/qpt/parse-workbook'
import {
  createParseResultHandler,
  HttpError,
  type ParseResultDependencies,
} from '../../supabase/functions/parse-result-xlsx/handler'
import { databaseError } from '../../supabase/functions/parse-result-xlsx/database-error'
import {
  previewMetadataForStorage,
  safeIssuesForStorage,
  validationSummaryForStorage,
} from '../../supabase/functions/parse-result-xlsx/metadata'
import { parseAllowedOrigins } from '../../supabase/functions/parse-result-xlsx/origins'

const origin = 'https://students.conceptinstitute.co.in'
const importId = '10000000-0000-4000-8000-000000000001'

const prepared: PreparedQptImport = {
  format: 'canonical',
  parserVersion: 'canonical-v1',
  rawSha256: 'a'.repeat(64),
  normalizedSha256: 'b'.repeat(64),
  reviewState: 'READY_FOR_REVIEW',
  blockingIssues: [],
  warnings: [],
  safeSummary: {
    studentCount: 1,
    scoreRowCount: 1,
    subjectCount: 1,
    negativeScoreCount: 0,
    absentCount: 0,
  },
  stagePayload: {
    assessment: {
      parser_version: 'canonical-v1',
      template_version: 'canonical-v1',
      assessment_code: 'QPT-TEST-1',
      academic_year: '2026-27',
      qpt_number: 1,
      batch_code: 'TEST-A',
      test_date: '2026-07-13',
      display_title: 'Synthetic QPT 1',
      ranking_basis: 'assessment_total',
    },
    rows: [
      {
        roll_no: 'TEST-001',
        student_name_for_review: 'Test Student 001',
        subject_code: 'MATHS',
        subject_name: 'Maths',
        max_marks: '100',
        score: '80',
        status: 'present',
        source_rank: 1,
      },
    ],
  },
}

function dependencies(
  overrides: Partial<ParseResultDependencies> = {},
): ParseResultDependencies {
  return {
    allowedOrigins: new Set([origin, 'http://127.0.0.1:5173']),
    authenticate: vi.fn().mockResolvedValue({ userId: 'staff-user' }),
    confirmUpload: vi.fn().mockResolvedValue(undefined),
    claimImport: vi.fn().mockResolvedValue({
      importId,
      storageBucket: 'qpt-imports',
      storagePath: 'staff-user/import.xlsx',
      byteSize: 4,
      originalFilename: 'QPT-TEST-1.xlsx',
      status: 'parsing',
      revisionId: null,
    }),
    downloadWorkbook: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    deleteWorkbook: vi.fn().mockResolvedValue(undefined),
    prepareWorkbook: vi.fn().mockResolvedValue(prepared),
    commitParsedImport: vi.fn().mockResolvedValue({ revisionId: 'revision-1' }),
    completeRejectedImport: vi.fn().mockResolvedValue(undefined),
    rawSha256: vi.fn().mockResolvedValue('c'.repeat(64)),
    ...overrides,
  }
}

function request(body: unknown = { importId }, init: RequestInit = {}) {
  return new Request('https://functions.example.invalid/parse-result-xlsx', {
    method: 'POST',
    headers: {
      authorization: 'Bearer valid-token',
      'content-type': 'application/json',
      origin,
      ...init.headers,
    },
    body: JSON.stringify(body),
    ...init,
  })
}

describe('parse-result-xlsx handler', () => {
  it('maps PostgreSQL numeric overflow during commit to a terminal staging conflict', () => {
    const error = databaseError({ code: '22003' }, 'commit')

    expect(error).toMatchObject({
      status: 409,
      code: 'staging_conflict',
    })
  })

  it('allows HTTP only for exact local development origins', () => {
    expect(
      parseAllowedOrigins('https://students.conceptinstitute.co.in,http://localhost:5173'),
    ).toEqual(
      new Set([
        'https://students.conceptinstitute.co.in',
        'http://localhost:5173',
      ]),
    )
    expect(() => parseAllowedOrigins('http://students.conceptinstitute.co.in')).toThrow(
      'Invalid exact origin',
    )
    expect(() => parseAllowedOrigins('*')).toThrow('exact HTTP(S) origins')
  })

  it('allows the alternate local Vite port used when 5173 is occupied', () => {
    const defaults = parseAllowedOrigins(undefined)

    expect(defaults).toContain('http://127.0.0.1:4173')
    expect(defaults).toContain('http://localhost:4173')
  })

  it('stores actionable safe issues and review aggregates without roster rows', () => {
    const quarantined: PreparedQptImport = {
      ...prepared,
      reviewState: 'QUARANTINED',
      blockingIssues: [
        {
          code: 'filename_batch_mismatch',
          message: 'The filename batch does not match the Sheet1 title.',
        },
      ],
    }

    expect(validationSummaryForStorage(quarantined)).toMatchObject({
      student_count: 1,
      row_count: 1,
      subject_count: 1,
      subjects: [{ code: 'MATHS', row_count: 1, max_marks: '100' }],
      status_counts: { present: 1 },
      blocking_issues: [
        {
          code: 'filename_batch_mismatch',
          message: 'The filename batch does not match the Sheet1 title.',
        },
      ],
    })
    const preview = previewMetadataForStorage(quarantined)
    expect(preview).not.toHaveProperty('rows')
    expect(JSON.stringify(preview)).not.toContain('TEST-001')
    expect(JSON.stringify(preview)).not.toContain('Test Student 001')
    expect(JSON.stringify(preview)).not.toContain('"80"')
    expect(
      safeIssuesForStorage([
        {
          code: 'unexpected_sheet',
          message: 'Remove the unexpected worksheet.',
          sheet: 'Student Riya Sharma',
          row: 1,
        },
      ]),
    ).toEqual([
      {
        code: 'unexpected_sheet',
        message: 'Remove the unexpected worksheet.',
        row: 1,
      },
    ])
  })

  it('answers an allowed CORS preflight without authenticating', async () => {
    const deps = dependencies()
    const response = await createParseResultHandler(deps)(
      new Request('https://functions.example.invalid/parse-result-xlsx', {
        method: 'OPTIONS',
        headers: { origin },
      }),
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(origin)
    expect(deps.authenticate).not.toHaveBeenCalled()
  })

  it('rejects unapproved browser origins', async () => {
    const response = await createParseResultHandler(dependencies())(
      request(undefined, { headers: { origin: 'https://attacker.invalid' } }),
    )

    expect(response.status).toBe(403)
  })

  it('requires a valid bearer token and import UUID', async () => {
    const handler = createParseResultHandler(dependencies())
    const missingToken = await handler(
      request(undefined, { headers: { origin, 'content-type': 'application/json' } }),
    )
    const invalidId = await handler(request({ importId: 'not-a-uuid' }))

    expect(missingToken.status).toBe(401)
    expect(invalidId.status).toBe(400)
  })

  it('authenticates, claims, parses, and atomically stages a valid workbook', async () => {
    const deps = dependencies()
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      importId,
      revisionId: 'revision-1',
      state: 'staged',
    })
    expect(deps.confirmUpload).toHaveBeenCalledWith('valid-token', importId)
    expect(deps.commitParsedImport).toHaveBeenCalledWith(
      expect.objectContaining({ importId, prepared }),
    )
    expect(deps.completeRejectedImport).not.toHaveBeenCalled()
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
  })

  it('records quarantine metadata without staging student rows', async () => {
    const quarantined: PreparedQptImport = {
      ...prepared,
      reviewState: 'QUARANTINED',
      blockingIssues: [
        {
          code: 'filename_batch_mismatch',
          message: 'The filename batch does not match the Sheet1 title.',
        },
      ],
    }
    const deps = dependencies({
      prepareWorkbook: vi.fn().mockResolvedValue(quarantined),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ state: 'quarantined' })
    expect(deps.completeRejectedImport).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'quarantined', prepared: quarantined }),
    )
    expect(deps.commitParsedImport).not.toHaveBeenCalled()
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
  })

  it('records safe validation codes for a malformed workbook', async () => {
    const deps = dependencies({
      prepareWorkbook: vi.fn().mockRejectedValue(
        new WorkbookValidationError([
          { code: 'invalid_zip', message: 'The XLSX ZIP package is incomplete.' },
        ]),
      ),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ state: 'failed' })
    expect(deps.completeRejectedImport).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        issues: [expect.objectContaining({ code: 'invalid_zip' })],
      }),
    )
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
  })

  it('fails closed when the stored byte size does not match the reservation', async () => {
    const deps = dependencies({
      claimImport: vi.fn().mockResolvedValue({
        importId,
        storageBucket: 'qpt-imports',
        storagePath: 'staff-user/import.xlsx',
        byteSize: 5,
        originalFilename: 'QPT-TEST-1.xlsx',
        status: 'parsing',
        revisionId: null,
      }),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    expect(deps.prepareWorkbook).not.toHaveBeenCalled()
    expect(deps.completeRejectedImport).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        issues: [expect.objectContaining({ code: 'stored_size_mismatch' })],
      }),
    )
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
  })

  it('records a safe terminal failure when parsed rows cannot be staged', async () => {
    const deps = dependencies({
      commitParsedImport: vi.fn().mockRejectedValue(
        new HttpError(
          409,
          'staging_conflict',
          'The parsed workbook conflicts with existing data.',
        ),
      ),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ state: 'failed' })
    expect(deps.completeRejectedImport).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        prepared,
        issues: [expect.objectContaining({ code: 'staging_conflict' })],
      }),
    )
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
  })

  it('retains the source workbook when parsing fails unexpectedly', async () => {
    const deps = dependencies({
      prepareWorkbook: vi.fn().mockRejectedValue(new Error('transient parser fault')),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(500)
    expect(deps.completeRejectedImport).not.toHaveBeenCalled()
    expect(deps.deleteWorkbook).not.toHaveBeenCalled()
  })

  it('returns a retryable error if terminal source cleanup fails', async () => {
    const deps = dependencies({
      deleteWorkbook: vi.fn().mockRejectedValue(
        new HttpError(
          502,
          'storage_cleanup_failed',
          'Workbook cleanup is temporarily unavailable.',
        ),
      ),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(502)
    expect(deps.commitParsedImport).toHaveBeenCalledOnce()
    expect(deps.deleteWorkbook).toHaveBeenCalledOnce()
  })

  it('resumes a terminal response at the cleanup boundary without reparsing', async () => {
    const deps = dependencies({
      claimImport: vi.fn().mockResolvedValue({
        importId,
        storageBucket: 'qpt-imports',
        storagePath: 'staff-user/import.xlsx',
        byteSize: 4,
        originalFilename: 'QPT-TEST-1.xlsx',
        status: 'staged',
        revisionId: 'revision-1',
      }),
    })
    const response = await createParseResultHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      importId,
      revisionId: 'revision-1',
      state: 'staged',
    })
    expect(deps.deleteWorkbook).toHaveBeenCalledWith(
      'qpt-imports',
      'staff-user/import.xlsx',
    )
    expect(deps.downloadWorkbook).not.toHaveBeenCalled()
    expect(deps.prepareWorkbook).not.toHaveBeenCalled()
    expect(deps.commitParsedImport).not.toHaveBeenCalled()
  })

  it('preserves authorization and claim conflict status codes', async () => {
    const forbiddenDependencies = dependencies({
      confirmUpload: vi.fn().mockRejectedValue(
        new HttpError(403, 'forbidden', 'Uploader role required.'),
      ),
    })
    const forbidden = await createParseResultHandler(forbiddenDependencies)(request())
    const conflictDependencies = dependencies({
      claimImport: vi.fn().mockRejectedValue(
        new HttpError(409, 'import_conflict', 'Import cannot be claimed.'),
      ),
    })
    const conflict = await createParseResultHandler(conflictDependencies)(request())

    expect(forbidden.status).toBe(403)
    expect(conflict.status).toBe(409)
    expect(forbiddenDependencies.deleteWorkbook).not.toHaveBeenCalled()
    expect(conflictDependencies.deleteWorkbook).not.toHaveBeenCalled()
  })
})
