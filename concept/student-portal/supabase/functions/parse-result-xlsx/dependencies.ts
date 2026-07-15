import { createClient } from '@supabase/supabase-js'
import {
  prepareQptImport,
} from '../../../src/domain/qpt/prepare-import.ts'
import {
  HttpError,
  type ParseResultDependencies,
  type RejectedImport,
} from './handler.ts'
import { databaseError } from './database-error.ts'
import {
  errorSummaryForStorage,
  previewMetadataForStorage,
  safeIssuesForStorage,
  validationSummaryForStorage,
} from './metadata.ts'
import { parseAllowedOrigins } from './origins.ts'

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digestInput = new Uint8Array(bytes.byteLength)
  digestInput.set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', digestInput.buffer)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function createProductionDependencies(): ParseResultDependencies {
  const supabaseUrl = requiredEnvironment('SUPABASE_URL')
  const anonymousKey = requiredEnvironment('SUPABASE_ANON_KEY')
  const serviceRoleKey = requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY')
  const clientOptions = {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  }
  const authenticationClient = createClient(
    supabaseUrl,
    anonymousKey,
    clientOptions,
  )
  const serviceClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    clientOptions,
  )

  return {
    allowedOrigins: parseAllowedOrigins(Deno.env.get('QPT_ALLOWED_ORIGINS')),

    async authenticate(token) {
      const { data, error } = await authenticationClient.auth.getUser(token)
      if (error || !data.user) {
        throw new HttpError(401, 'invalid_token', 'The session is invalid or expired.')
      }
      return { userId: data.user.id }
    },

    async confirmUpload(token, importId) {
      const userClient = createClient(supabaseUrl, anonymousKey, {
        ...clientOptions,
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
      const { error } = await userClient
        .schema('api')
        .rpc('confirm_import_upload', { p_import_id: importId })
      if (error) throw databaseError(error, 'confirm')
    },

    async claimImport(importId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('claim_import', { p_import_id: importId })
      if (error) throw databaseError(error, 'claim')

      const claim = Array.isArray(data) ? data[0] : undefined
      if (!claim) {
        throw new HttpError(409, 'import_conflict', 'The import could not be claimed.')
      }
      return {
        importId: String(claim.import_id),
        storageBucket: String(claim.storage_bucket),
        storagePath: String(claim.storage_path),
        byteSize: Number(claim.byte_size),
        originalFilename: String(claim.original_filename),
        status: String(claim.import_status) as
          | 'parsing'
          | 'parsed'
          | 'duplicate'
          | 'quarantined'
          | 'failed'
          | 'staged'
          | 'published',
        revisionId:
          typeof claim.revision_id === 'string' ? claim.revision_id : null,
      }
    },

    async downloadWorkbook(bucket, path) {
      const { data, error } = await serviceClient.storage.from(bucket).download(path)
      if (error || !data) {
        throw new HttpError(
          409,
          'stored_workbook_unavailable',
          'The uploaded workbook is no longer available.',
        )
      }
      return new Uint8Array(await data.arrayBuffer())
    },

    async deleteWorkbook(bucket, path) {
      const { error } = await serviceClient.storage.from(bucket).remove([path])
      if (error) {
        throw new HttpError(
          502,
          'storage_cleanup_failed',
          'Workbook cleanup is temporarily unavailable.',
        )
      }
    },

    prepareWorkbook: prepareQptImport,

    async commitParsedImport({ importId, prepared }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('commit_parsed_import', {
          p_import_id: importId,
          p_raw_sha256: prepared.rawSha256,
          p_normalized_hash: prepared.normalizedSha256,
          p_parser_version: prepared.parserVersion,
          p_preview_metadata: previewMetadataForStorage(prepared),
          p_validation_summary: validationSummaryForStorage(prepared),
          p_assessment: prepared.stagePayload.assessment,
          p_rows: prepared.stagePayload.rows,
        })
      if (error) throw databaseError(error, 'commit')
      if (typeof data !== 'string' || data.length === 0) {
        throw new HttpError(
          502,
          'invalid_commit_response',
          'The import service returned an invalid response.',
        )
      }
      return { revisionId: data }
    },

    async completeRejectedImport(input: RejectedImport) {
      const prepared = input.prepared
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_import_parse', {
          p_import_id: input.importId,
          p_raw_sha256:
            input.outcome === 'quarantined'
              ? input.prepared.rawSha256
              : input.rawSha256,
          p_normalized_hash: prepared?.normalizedSha256 ?? null,
          p_parser_version: prepared?.parserVersion ?? 'unparsed-v1',
          p_outcome: input.outcome,
          p_error_summary: errorSummaryForStorage(input.issues),
          p_preview_metadata: prepared
            ? previewMetadataForStorage(prepared)
            : { format: 'unrecognized' },
          p_validation_summary: prepared
            ? validationSummaryForStorage(prepared)
            : {
                review_state: 'FAILED',
                issue_count: input.issues.length,
                issues: safeIssuesForStorage(input.issues),
              },
        })
      if (error) throw databaseError(error, 'complete')
      if (data !== input.outcome) {
        throw new HttpError(
          409,
          'import_conflict',
          'The import was already completed with a different outcome.',
        )
      }
    },

    rawSha256: sha256,
  }
}
