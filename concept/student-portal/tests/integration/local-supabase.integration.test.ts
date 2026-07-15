// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import { describe, it } from 'vitest'
import { prepareQptImport } from '../../src/domain/qpt/prepare-import'
import type { Database } from '../../src/lib/database.types'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

type PortalClient = SupabaseClient<Database>

type LocalSupabaseConfiguration = {
  apiUrl: string
  anonymousKey: string
  serviceRoleKey: string
  databaseUrl: string
}

type WorkbookFixture = {
  bytes: Uint8Array
  fileName: string
  academicYear: string
  batchCode: string
  rollNo: string
  rawReviewSentinels: string[]
}

type ProvisionedUser = {
  id: string
  email: string
  password: string
}

function assertStep(condition: unknown, step: string): asserts condition {
  if (!condition) {
    throw new Error(`Local Supabase integration failed at: ${step}.`)
  }
}

async function assertFunctionStep(error: unknown, step: string): Promise<void> {
  if (!error) return
  const errorRecord = record(error)
  const context = errorRecord?.context
  let detail = text(errorRecord?.message)
  if (context instanceof Response) {
    try {
      detail = (await context.clone().text()).slice(0, 500)
    } catch {
      // The public error message remains the fallback diagnostic.
    }
  }
  throw new Error(
    `Local Supabase integration failed at: ${step}${detail ? ` (${detail})` : ''}.`,
  )
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseEnvironmentOutput(output: string): Record<string, string> {
  const parsed: Record<string, string> = {}

  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line.trim())
    if (!match) continue

    const [, key, rawValue] = match
    const value = rawValue.trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      parsed[key] = value.slice(1, -1)
    } else {
      parsed[key] = value
    }
  }

  return parsed
}

function discoverLocalConfiguration(): LocalSupabaseConfiguration {
  const configuredApiUrl =
    process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim()
  const configuredAnonymousKey =
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  const configuredServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim()
  const configuredDatabaseUrl =
    process.env.SUPABASE_DB_URL?.trim() ?? process.env.DB_URL?.trim()

  let localStatus: Record<string, string> = {}
  if (
    !configuredApiUrl ||
    !configuredAnonymousKey ||
    !configuredServiceRoleKey ||
    !configuredDatabaseUrl
  ) {
    const result = spawnSync(
      'npx',
      ['--no-install', 'supabase', 'status', '-o', 'env'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
        maxBuffer: 1024 * 1024,
      },
    )
    assertStep(
      !result.error && result.status === 0 && typeof result.stdout === 'string',
      'local Supabase status discovery',
    )
    localStatus = parseEnvironmentOutput(result.stdout)
  }

  const apiUrl = configuredApiUrl ?? localStatus.API_URL
  const anonymousKey =
    configuredAnonymousKey ?? localStatus.ANON_KEY ?? localStatus.PUBLISHABLE_KEY
  const serviceRoleKey =
    configuredServiceRoleKey ??
    localStatus.SERVICE_ROLE_KEY ??
    localStatus.SECRET_KEY
  const databaseUrl = configuredDatabaseUrl ?? localStatus.DB_URL

  assertStep(
    Boolean(apiUrl && anonymousKey && serviceRoleKey && databaseUrl),
    'local Supabase credential discovery',
  )

  return {
    apiUrl,
    anonymousKey,
    serviceRoleKey,
    databaseUrl,
  }
}

function parseLoopbackUrl(
  value: string,
  protocols: ReadonlySet<string>,
  step: string,
): URL {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Local Supabase integration failed at: ${step}.`)
  }

  assertStep(protocols.has(parsed.protocol), step)
  assertStep(LOOPBACK_HOSTS.has(parsed.hostname), step)
  return parsed
}

function assertLocalOnly(configuration: LocalSupabaseConfiguration): void {
  const apiUrl = parseLoopbackUrl(
    configuration.apiUrl,
    new Set(['http:']),
    'loopback API safety guard',
  )
  const databaseUrl = parseLoopbackUrl(
    configuration.databaseUrl,
    new Set(['postgres:', 'postgresql:']),
    'loopback database safety guard',
  )

  assertStep(!apiUrl.username && !apiUrl.password, 'loopback API safety guard')
  assertStep(Boolean(databaseUrl.username), 'loopback database safety guard')
}

function decoded(value: string, step: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new Error(`Local Supabase integration failed at: ${step}.`)
  }
}

function runLocalSql(databaseUrl: string, sql: string, step: string): void {
  const parsed = parseLoopbackUrl(
    databaseUrl,
    new Set(['postgres:', 'postgresql:']),
    'loopback database safety guard',
  )
  const databaseName = decoded(parsed.pathname.replace(/^\/+/, ''), step)
  assertStep(Boolean(databaseName), step)

  const result = spawnSync(process.env.PSQL_BIN?.trim() || 'psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input: sql,
    env: {
      ...process.env,
      PGHOST: parsed.hostname.replace(/^\[|\]$/gu, ''),
      PGPORT: parsed.port || '5432',
      PGUSER: decoded(parsed.username, step),
      PGPASSWORD: decoded(parsed.password, step),
      PGDATABASE: databaseName,
      PGCONNECT_TIMEOUT: '5',
      PGSSLMODE: 'disable',
    },
    maxBuffer: 1024 * 1024,
  })

  assertStep(!result.error && result.status === 0, step)
}

function sqlLiteral(value: string, step: string): string {
  assertStep(value.length > 0 && !value.includes('\0'), step)
  return `'${value.replaceAll("'", "''")}'`
}

function grantAdminRole(
  databaseUrl: string,
  adminId: string,
): void {
  assertStep(UUID_PATTERN.test(adminId), 'synthetic admin role fixture')

  runLocalSql(
    databaseUrl,
    `
      insert into app_private.account_roles (user_id, role, granted_by)
      values (
        ${sqlLiteral(adminId, 'synthetic admin role fixture')}::uuid,
        'admin',
        ${sqlLiteral(adminId, 'synthetic admin role fixture')}::uuid
      )
      on conflict (user_id, role) do nothing;
    `,
    'synthetic admin role fixture',
  )
}

function requiredPrivateSelector(name: string): string {
  const value = process.env[name]?.trim()
  const hasControlCharacter = value
    ? Array.from(value).some((character) => {
        const code = character.charCodeAt(0)
        return code <= 31 || code === 127
      })
    : false
  assertStep(
    value !== undefined &&
      value.length > 0 &&
      value.length <= 200 &&
      !hasControlCharacter,
    'private workbook selector configuration',
  )
  return value
}

async function canonicalFixture(): Promise<WorkbookFixture> {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()
  const academicYear = '2026-27'
  const batchCode = `BATCH-${suffix}`
  const rollNo = `ROLL-${suffix}`
  const studentName = 'Synthetic Integration Student'
  const templateUrl = new URL(
    '../../public/templates/qpt-import-template.xlsx',
    import.meta.url,
  )

  let source: Buffer
  try {
    source = await readFile(templateUrl)
  } catch {
    throw new Error('Local Supabase integration failed at: canonical workbook load.')
  }

  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(Uint8Array.from(source).buffer)
  } catch {
    throw new Error('Local Supabase integration failed at: canonical workbook load.')
  }

  const assessment = workbook.getWorksheet('Assessment')
  const scores = workbook.getWorksheet('Scores')
  assertStep(
    assessment !== undefined && scores !== undefined,
    'canonical workbook structure',
  )

  assessment.getCell('B2').value = '1'
  assessment.getCell('B3').value = `INTEGRATION-${suffix}`
  assessment.getCell('B4').value = academicYear
  assessment.getCell('B5').value = 990001
  assessment.getCell('B6').value = batchCode
  assessment.getCell('B7').value = '2026-07-14'
  assessment.getCell('B8').value = 'Synthetic Integration QPT'
  assessment.getCell('B9').value = 'TOTAL_SCORE'

  scores.getCell('A2').value = rollNo
  scores.getCell('B2').value = studentName
  scores.getCell('C2').value = 'MATHS'
  scores.getCell('D2').value = 100
  scores.getCell('E2').value = 73
  scores.getCell('F2').value = 'PRESENT'
  scores.getCell('G2').value = 1

  const output = await workbook.xlsx.writeBuffer()
  const bytes = new Uint8Array(output)
  assertStep(
    bytes.byteLength > 0 && bytes.byteLength <= MAX_WORKBOOK_BYTES,
    'canonical workbook generation',
  )

  return {
    bytes,
    fileName: 'synthetic-integration.xlsx',
    academicYear,
    batchCode,
    rollNo,
    rawReviewSentinels: [rollNo, studentName],
  }
}

async function privateFixture(pathValue: string): Promise<WorkbookFixture> {
  const path = resolve(pathValue)
  let source: Buffer
  try {
    source = await readFile(path)
  } catch {
    throw new Error('Local Supabase integration failed at: private workbook load.')
  }

  const fileName = basename(path)
  assertStep(
    fileName.toLowerCase().endsWith('.xlsx') &&
      fileName.length >= 6 &&
      fileName.length <= 255 &&
      source.byteLength > 0 &&
      source.byteLength <= MAX_WORKBOOK_BYTES,
    'private workbook validation',
  )

  const configuredSelectors = {
    academicYear: process.env.QPT_INTEGRATION_ACADEMIC_YEAR?.trim(),
    batchCode: process.env.QPT_INTEGRATION_BATCH_CODE?.trim(),
    rollNo: process.env.QPT_INTEGRATION_ROLL_NO?.trim(),
  }
  const hasConfiguredSelector = Object.values(configuredSelectors).some(Boolean)
  if (hasConfiguredSelector) {
    return {
      bytes: new Uint8Array(source),
      fileName,
      academicYear: requiredPrivateSelector('QPT_INTEGRATION_ACADEMIC_YEAR'),
      batchCode: requiredPrivateSelector('QPT_INTEGRATION_BATCH_CODE'),
      rollNo: requiredPrivateSelector('QPT_INTEGRATION_ROLL_NO'),
      rawReviewSentinels: [],
    }
  }

  let prepared: Awaited<ReturnType<typeof prepareQptImport>>
  try {
    prepared = await prepareQptImport(new Uint8Array(source), {
      sourceFilename: fileName,
    })
  } catch {
    throw new Error(
      'Local Supabase integration failed at: private workbook selector inference.',
    )
  }

  const selectedRow = prepared.stagePayload.rows[0]
  assertStep(
    prepared.reviewState === 'READY_FOR_REVIEW' && selectedRow !== undefined,
    'private workbook readiness',
  )

  return {
    bytes: new Uint8Array(source),
    fileName,
    academicYear: prepared.stagePayload.assessment.academic_year,
    batchCode: prepared.stagePayload.assessment.batch_code,
    rollNo: selectedRow.roll_no,
    rawReviewSentinels: [selectedRow.student_name_for_review],
  }
}

async function workbookFixture(): Promise<WorkbookFixture> {
  const privatePath = process.env.QPT_INTEGRATION_WORKBOOK_PATH?.trim()
  return privatePath ? privateFixture(privatePath) : canonicalFixture()
}

function client(apiUrl: string, key: string): PortalClient {
  return createClient<Database>(apiUrl, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

async function provisionUser(
  serviceClient: PortalClient,
  label: string,
  suffix: string,
): Promise<ProvisionedUser> {
  const email = `qpt-${label}-${suffix}@integration.invalid`
  const password = `Integration-${randomUUID()}-Aa1!`
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  assertStep(!error && Boolean(data.user), 'synthetic Auth user provisioning')
  assertStep(UUID_PATTERN.test(data.user.id), 'synthetic Auth user provisioning')
  return { id: data.user.id, email, password }
}

async function signedInClient(
  configuration: LocalSupabaseConfiguration,
  user: ProvisionedUser,
): Promise<PortalClient> {
  const userClient = client(configuration.apiUrl, configuration.anonymousKey)
  const { data, error } = await userClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  assertStep(!error && Boolean(data.session), 'synthetic Auth sign-in')
  assertStep(data.user.id === user.id, 'synthetic Auth sign-in')
  return userClient
}

async function signedInRollClient(
  configuration: LocalSupabaseConfiguration,
  loginId: string,
  password: string,
): Promise<PortalClient> {
  const userClient = client(configuration.apiUrl, configuration.anonymousKey)
  const { data, error } = await userClient.auth.signInWithPassword({
    email: `student.${loginId}@login.concept.invalid`,
    password,
  })

  assertStep(!error && Boolean(data.session), 'roll-number Auth sign-in')
  return userClient
}

function containsRawRosterKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawRosterKeys)
  const item = record(value)
  if (!item) return false

  const rawKeys = new Set([
    'rows',
    'scores',
    'roll_no',
    'student_name',
    'student_name_for_review',
    'full_name',
    'score',
    'source_rank',
    'source_student_name',
  ])

  return Object.entries(item).some(
    ([key, nested]) => rawKeys.has(key) || containsRawRosterKeys(nested),
  )
}

const describeLocal =
  process.env.RUN_LOCAL_INTEGRATION === '1' ? describe : describe.skip

describeLocal('local Supabase result pipeline', () => {
  it(
    'exercises one-admin publication and the roll-number first-login path',
    async () => {
      const configuration = discoverLocalConfiguration()
      assertLocalOnly(configuration)
      const fixture = await workbookFixture()
      const serviceClient = client(
        configuration.apiUrl,
        configuration.serviceRoleKey,
      )
      const authSuffix = randomUUID().replaceAll('-', '').slice(0, 12)

      const adminUser = await provisionUser(serviceClient, 'admin', authSuffix)
      grantAdminRole(configuration.databaseUrl, adminUser.id)

      const adminClient = await signedInClient(configuration, adminUser)
      const initialAccountDirectory = await adminClient.functions.invoke(
        'student-account',
        { body: { action: 'list' } },
      )
      await assertFunctionStep(
        initialAccountDirectory.error,
        'admin student account directory',
      )

      const begin = await adminClient.schema('api').rpc('begin_import', {
        p_client_request_id: randomUUID(),
        p_original_filename: fixture.fileName,
        p_byte_size: fixture.bytes.byteLength,
      })
      assertStep(!begin.error && Array.isArray(begin.data), 'begin import RPC')
      const uploadTarget = record(begin.data[0])
      const importId = text(uploadTarget?.import_id)
      const storageBucket = text(uploadTarget?.storage_bucket)
      const storagePath = text(uploadTarget?.storage_path)
      assertStep(
        UUID_PATTERN.test(importId) && Boolean(storageBucket && storagePath),
        'private upload target',
      )

      const upload = await adminClient.storage
        .from(storageBucket)
        .upload(storagePath, fixture.bytes, {
          cacheControl: '0',
          contentType: XLSX_MIME,
          upsert: false,
        })
      assertStep(!upload.error, 'private workbook upload')

      const invocation = await adminClient.functions.invoke(
        'parse-result-xlsx',
        { body: { importId } },
      )
      await assertFunctionStep(
        invocation.error,
        'workbook parser Edge Function invocation',
      )
      const invocationResult = record(invocation.data)
      const revisionId = text(invocationResult?.revisionId)
      assertStep(
        invocationResult?.state === 'staged' &&
          invocationResult?.importId === importId &&
          UUID_PATTERN.test(revisionId),
        'Edge Function staged outcome',
      )

      const terminalObject = await serviceClient.storage
        .from(storageBucket)
        .download(storagePath)
      assertStep(
        terminalObject.data === null && terminalObject.error !== null,
        'terminal private workbook deletion',
      )

      const review = await adminClient.schema('api').rpc('import_review', {
        p_import_id: importId,
      })
      assertStep(!review.error && Array.isArray(review.data), 'safe import review RPC')
      const reviewItem = record(review.data[0])
      assertStep(
        reviewItem?.status === 'staged' &&
          reviewItem?.revision_id === revisionId &&
          Number(reviewItem?.row_count) > 0,
        'safe staged review',
      )
      const safeReviewPayload = {
        preview: reviewItem?.preview_metadata,
        validation: reviewItem?.validation_summary,
        error: reviewItem?.error_summary,
      }
      assertStep(
        !containsRawRosterKeys(safeReviewPayload),
        'safe review roster boundary',
      )
      const serializedSafeReview = JSON.stringify(safeReviewPayload)
      assertStep(
        fixture.rawReviewSentinels.every(
          (sentinel) => !serializedSafeReview.includes(sentinel),
        ),
        'safe review value boundary',
      )

      const accountDirectory = await adminClient.functions.invoke('student-account', {
        body: { action: 'list' },
      })
      await assertFunctionStep(accountDirectory.error, 'admin student account directory')
      const accountRows = record(accountDirectory.data)?.accounts
      assertStep(Array.isArray(accountRows), 'admin student account directory')
      const selectedAccount = accountRows
        .map(record)
        .find(
          (account) =>
            account?.rollNo === fixture.rollNo &&
            account?.batchCode === fixture.batchCode,
        )
      const linkedStudentId = text(selectedAccount?.studentId)
      assertStep(
        UUID_PATTERN.test(linkedStudentId) &&
          selectedAccount?.loginId === null &&
          selectedAccount?.accountStatus === 'not-provisioned',
        'unprovisioned workbook student account',
      )

      const provision = await adminClient.functions.invoke('student-account', {
        body: { action: 'provision', studentId: linkedStudentId },
      })
      assertStep(!provision.error, 'student roll-login provisioning')
      const issuedCredential = record(provision.data)
      const studentLoginId = text(issuedCredential?.loginId)
      const temporaryPassword = text(issuedCredential?.temporaryPassword)
      assertStep(
        issuedCredential?.state === 'provisioned' &&
          Boolean(studentLoginId) &&
          temporaryPassword.length >= 14 &&
          !JSON.stringify(issuedCredential).includes('@login.concept.invalid'),
        'one-time temporary credential response',
      )

      let studentClient = await signedInRollClient(
        configuration,
        studentLoginId,
        temporaryPassword,
      )
      const gatedContext = await studentClient.schema('api').rpc('my_portal_context')
      const gatedContextItem = record(gatedContext.data)
      assertStep(
        !gatedContext.error &&
          gatedContextItem?.must_change_password === true &&
          Array.isArray(gatedContextItem.students) &&
          gatedContextItem.students.length === 0,
        'temporary password portal gate',
      )

      const privatePassword = `Private-${randomUUID()}-Aa1`
      const changedPassword = await studentClient.functions.invoke('student-account', {
        body: { action: 'change-initial-password', newPassword: privatePassword },
      })
      assertStep(
        !changedPassword.error && record(changedPassword.data)?.state === 'active',
        'mandatory first-login password change',
      )

      await studentClient.auth.signOut({ scope: 'local' })
      const rejectedTemporaryClient = client(
        configuration.apiUrl,
        configuration.anonymousKey,
      )
      const rejectedTemporary = await rejectedTemporaryClient.auth.signInWithPassword({
        email: `student.${studentLoginId}@login.concept.invalid`,
        password: temporaryPassword,
      })
      assertStep(
        Boolean(rejectedTemporary.error) && rejectedTemporary.data.session === null,
        'temporary password invalidation',
      )
      studentClient = await signedInRollClient(
        configuration,
        studentLoginId,
        privatePassword,
      )

      const linkedStudents = await studentClient.schema('api').rpc('my_students')
      assertStep(
        !linkedStudents.error &&
          Array.isArray(linkedStudents.data) &&
          linkedStudents.data.length === 1,
        'student-scoped link read',
      )
      const linkedStudent = record(linkedStudents.data[0])
      assertStep(
        linkedStudent?.student_id === linkedStudentId &&
          linkedStudent?.roll_no === fixture.rollNo &&
          linkedStudent?.batch_code === fixture.batchCode,
        'roll-login student-scoped identity',
      )

      const stagedResults = await studentClient
        .schema('api')
        .rpc('student_results', { p_student_id: linkedStudentId })
      assertStep(
        !stagedResults.error &&
          Array.isArray(stagedResults.data) &&
          stagedResults.data.length === 0,
        'staged result isolation',
      )

      const pending = await adminClient.schema('api').rpc('pending_revisions')
      assertStep(!pending.error && Array.isArray(pending.data), 'admin review queue')
      const pendingRevision = pending.data.find(
        (candidate) => candidate.revision_id === revisionId,
      )
      assertStep(
        pendingRevision?.can_publish === true &&
          pendingRevision.active_revision_id === null &&
          pendingRevision.is_latest_revision === true &&
          Array.isArray(pendingRevision.subject_summaries) &&
          pendingRevision.subject_summaries.length > 0 &&
          pendingRevision.uploader_id === adminUser.id,
        'same-admin publication authorization and safe review context',
      )

      const publication = await adminClient.schema('api').rpc('publish_revision', {
          p_revision_id: revisionId,
          p_expected_active_revision_id: pendingRevision?.active_revision_id ?? null,
        })
      assertStep(
        !publication.error && UUID_PATTERN.test(publication.data ?? ''),
        'same-admin publication',
      )

      const publishedResults = await studentClient
        .schema('api')
        .rpc('student_results', { p_student_id: linkedStudentId })
      assertStep(
        !publishedResults.error &&
          Array.isArray(publishedResults.data) &&
          publishedResults.data.length > 0,
        'student-scoped published result read',
      )
      assertStep(
        publishedResults.data.every(
          (result) =>
            result.revision_id === revisionId &&
            result.roll_no === fixture.rollNo &&
            result.batch_code === fixture.batchCode,
        ),
        'student-scoped published result boundary',
      )
    },
    120_000,
  )
})
