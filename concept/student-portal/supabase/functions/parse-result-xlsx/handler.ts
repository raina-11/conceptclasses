import type { PreparedQptImport } from '../../../src/domain/qpt/prepare-import.ts'
import {
  WorkbookValidationError,
  type WorkbookIssue,
} from '../../../src/domain/qpt/parse-workbook.ts'

export type ImportClaim = {
  importId: string
  storageBucket: string
  storagePath: string
  byteSize: number
  originalFilename: string
  status:
    | 'parsing'
    | 'parsed'
    | 'duplicate'
    | 'quarantined'
    | 'failed'
    | 'staged'
    | 'published'
  revisionId: string | null
}

type FailedImport = {
  importId: string
  outcome: 'failed'
  rawSha256: string
  prepared?: PreparedQptImport
  issues: WorkbookIssue[]
}

type QuarantinedImport = {
  importId: string
  outcome: 'quarantined'
  prepared: PreparedQptImport
  issues: WorkbookIssue[]
}

export type RejectedImport = FailedImport | QuarantinedImport

export type ParseResultDependencies = {
  allowedOrigins: ReadonlySet<string>
  authenticate(token: string): Promise<{ userId: string }>
  confirmUpload(token: string, importId: string): Promise<void>
  claimImport(importId: string): Promise<ImportClaim>
  downloadWorkbook(bucket: string, path: string): Promise<Uint8Array>
  deleteWorkbook(bucket: string, path: string): Promise<void>
  prepareWorkbook(
    bytes: Uint8Array,
    options: { sourceFilename: string },
  ): Promise<PreparedQptImport>
  commitParsedImport(input: {
    importId: string
    prepared: PreparedQptImport
  }): Promise<{ revisionId: string }>
  completeRejectedImport(input: RejectedImport): Promise<void>
  rawSha256(bytes: Uint8Array): Promise<string>
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const STORED_SIZE_MISMATCH: WorkbookIssue = {
  code: 'stored_size_mismatch',
  message: 'The stored workbook size does not match the upload reservation.',
}

const STAGING_CONFLICT: WorkbookIssue = {
  code: 'staging_conflict',
  message: 'The parsed workbook conflicts with existing portal data.',
}

function responseHeaders(
  origin: string | null,
  allowedOrigins: ReadonlySet<string>,
): Headers {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    vary: 'Origin',
    'x-content-type-options': 'nosniff',
  })
  if (origin !== null && allowedOrigins.has(origin)) {
    headers.set('access-control-allow-origin', origin)
  }
  return headers
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Headers,
): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

function errorResponse(error: unknown, headers: Headers): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: { code: error.code, message: error.message } },
      error.status,
      headers,
    )
  }

  return jsonResponse(
    {
      error: {
        code: 'internal_error',
        message: 'The workbook could not be processed. Please try again.',
      },
    },
    500,
    headers,
  )
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer\s+(\S+)$/i)
  if (!match) {
    throw new HttpError(401, 'authentication_required', 'A bearer token is required.')
  }
  return match[1]
}

async function requestedImportId(request: Request): Promise<string> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'invalid_request', 'A JSON request body is required.')
  }

  const importId =
    typeof body === 'object' &&
    body !== null &&
    'importId' in body &&
    typeof body.importId === 'string'
      ? body.importId
      : ''

  if (!UUID_PATTERN.test(importId)) {
    throw new HttpError(400, 'invalid_import_id', 'A valid import UUID is required.')
  }
  return importId
}

function validateClaim(claim: ImportClaim, requestedId: string): void {
  if (claim.importId !== requestedId) {
    throw new HttpError(409, 'import_conflict', 'The claimed import does not match the request.')
  }
  if (
    claim.storageBucket !== 'qpt-imports' ||
    claim.storagePath.length === 0 ||
    claim.storagePath.includes('..') ||
    !Number.isSafeInteger(claim.byteSize) ||
    claim.byteSize < 1 ||
    claim.byteSize > 10 * 1024 * 1024 ||
    claim.originalFilename.length === 0 ||
    ![
      'parsing',
      'parsed',
      'duplicate',
      'quarantined',
      'failed',
      'staged',
      'published',
    ].includes(claim.status)
  ) {
    throw new HttpError(409, 'invalid_import_claim', 'The import reservation is invalid.')
  }
}

function completedImportBody(claim: ImportClaim) {
  const state =
    claim.status === 'quarantined'
      ? 'quarantined'
      : claim.status === 'failed'
        ? 'failed'
        : 'staged'
  return {
    importId: claim.importId,
    ...(claim.revisionId ? { revisionId: claim.revisionId } : {}),
    state,
  }
}

async function recordFailedImport(
  dependencies: ParseResultDependencies,
  importId: string,
  bytes: Uint8Array,
  issues: WorkbookIssue[],
): Promise<void> {
  await dependencies.completeRejectedImport({
    importId,
    outcome: 'failed',
    rawSha256: await dependencies.rawSha256(bytes),
    issues,
  })
}

export function createParseResultHandler(dependencies: ParseResultDependencies) {
  return async function parseResultXlsx(request: Request): Promise<Response> {
    const origin = request.headers.get('origin')
    const headers = responseHeaders(origin, dependencies.allowedOrigins)

    try {
      if (origin !== null && !dependencies.allowedOrigins.has(origin)) {
        throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed.')
      }

      if (request.method === 'OPTIONS') {
        if (origin === null) {
          throw new HttpError(400, 'origin_required', 'CORS preflight requires an origin.')
        }
        headers.delete('content-type')
        headers.set(
          'access-control-allow-headers',
          'authorization, apikey, content-type, x-client-info',
        )
        headers.set('access-control-allow-methods', 'POST, OPTIONS')
        headers.set('access-control-max-age', '600')
        return new Response(null, { status: 204, headers })
      }

      if (request.method !== 'POST') {
        headers.set('allow', 'POST, OPTIONS')
        throw new HttpError(405, 'method_not_allowed', 'Only POST is supported.')
      }

      const token = bearerToken(request)
      await dependencies.authenticate(token)
      const importId = await requestedImportId(request)

      // This user-scoped RPC performs the ownership/role check before any
      // service-role operation can see the private workbook.
      await dependencies.confirmUpload(token, importId)
      const claim = await dependencies.claimImport(importId)
      validateClaim(claim, importId)

      if (claim.status !== 'parsing') {
        await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
        return jsonResponse(completedImportBody(claim), 200, headers)
      }

      const bytes = await dependencies.downloadWorkbook(
        claim.storageBucket,
        claim.storagePath,
      )
      if (bytes.byteLength !== claim.byteSize) {
        await recordFailedImport(
          dependencies,
          importId,
          bytes,
          [STORED_SIZE_MISMATCH],
        )
        await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
        return jsonResponse({ importId, state: 'failed' }, 200, headers)
      }

      let prepared: PreparedQptImport
      try {
        prepared = await dependencies.prepareWorkbook(bytes, {
          sourceFilename: claim.originalFilename,
        })
      } catch (error) {
        if (!(error instanceof WorkbookValidationError)) throw error
        await recordFailedImport(dependencies, importId, bytes, error.issues)
        await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
        return jsonResponse({ importId, state: 'failed' }, 200, headers)
      }

      if (prepared.reviewState === 'QUARANTINED') {
        await dependencies.completeRejectedImport({
          importId,
          outcome: 'quarantined',
          prepared,
          issues: prepared.blockingIssues,
        })
        await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
        return jsonResponse({ importId, state: 'quarantined' }, 200, headers)
      }

      let revisionId: string
      try {
        const committed = await dependencies.commitParsedImport({
          importId,
          prepared,
        })
        revisionId = committed.revisionId
      } catch (error) {
        if (!(error instanceof HttpError) || error.code !== 'staging_conflict') {
          throw error
        }
        await dependencies.completeRejectedImport({
          importId,
          outcome: 'failed',
          rawSha256: prepared.rawSha256,
          prepared,
          issues: [STAGING_CONFLICT],
        })
        await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
        return jsonResponse({ importId, state: 'failed' }, 200, headers)
      }
      await dependencies.deleteWorkbook(claim.storageBucket, claim.storagePath)
      return jsonResponse({ importId, revisionId, state: 'staged' }, 200, headers)
    } catch (error) {
      return errorResponse(error, headers)
    }
  }
}
