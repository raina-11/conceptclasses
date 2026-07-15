import { createClient } from '@supabase/supabase-js'
import {
  resolveSupabaseApiKeys,
  type EnvironmentReader,
} from '../_shared/supabase-api-keys.ts'
import {
  HttpError,
  type AdminStudentAccount,
  type CompletedProvisionTarget,
  type CredentialResetTarget,
  type CredentialState,
  type ProvisionTarget,
  type StudentAccountDependencies,
} from './handler.ts'
import { parseAllowedOrigins } from './origins.ts'
import { generateTemporaryPassword } from './password.ts'

type JsonObject = Record<string, unknown>

const AUTH_USERS_PER_PAGE = 1_000
const MAXIMUM_AUTH_USER_PAGES = 10

function requiredEnvironment(
  environment: EnvironmentReader,
  ...names: string[]
): string {
  for (const name of names) {
    const value = environment.get(name)?.trim()
    if (value) return value
  }
  throw new Error(`Missing required environment variable: ${names.join(' or ')}`)
}

function record(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : null
}

function records(value: unknown): JsonObject[] {
  if (Array.isArray(value)) {
    return value.map(record).filter((item): item is JsonObject => item !== null)
  }
  const item = record(value)
  return item ? [item] : []
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function errorCode(error: unknown): string {
  return text(record(error)?.code)
}

function databaseError(error: unknown, context: 'admin' | 'state' | 'complete'): HttpError {
  const code = errorCode(error)
  if (code === '42501') {
    return new HttpError(
      403,
      context === 'admin' ? 'admin_required' : 'account_unavailable',
      context === 'admin'
        ? 'An active administrator account is required.'
        : 'This account cannot complete the requested credential change.',
    )
  }
  if (code === 'P0002') {
    return new HttpError(404, 'account_not_found', 'The requested student account was not found.')
  }
  if (code === '22023' || code === '23514') {
    return new HttpError(400, 'invalid_account_request', 'The account request is invalid.')
  }
  if (code === '40001' && context === 'complete') {
    return new HttpError(
      409,
      'credential_state_changed',
      'The credential state changed. Ask an administrator for a new temporary password.',
    )
  }
  if (code === '55P03') {
    return new HttpError(
      409,
      'credential_operation_in_progress',
      'Another credential operation is already in progress. Wait and try again.',
    )
  }
  if (
    code === '23503' ||
    code === '23505' ||
    code === '40001' ||
    code === '55000'
  ) {
    return new HttpError(
      409,
      'account_conflict',
      'The account changed or conflicts with existing portal data. Refresh and try again.',
    )
  }
  return new HttpError(
    502,
    'account_service_unavailable',
    'The account service is temporarily unavailable.',
  )
}

function identityError(error: unknown, operation: 'create' | 'update' | 'lookup'): HttpError {
  const code = errorCode(error)
  if (code === 'weak_password') {
    return new HttpError(
      400,
      'weak_password',
      'The password does not meet the configured security policy.',
    )
  }
  if (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    code === 'identity_already_exists'
  ) {
    return new HttpError(
      409,
      'account_conflict',
      'The student login identity already exists. Refresh and try again.',
    )
  }
  if (code === 'user_not_found') {
    return new HttpError(409, 'account_conflict', 'The student login identity is unavailable.')
  }
  return new HttpError(
    502,
    'identity_service_unavailable',
    operation === 'lookup'
      ? 'The identity directory is temporarily unavailable.'
      : 'The identity service is temporarily unavailable.',
  )
}

function firstRow(data: unknown, code: string): JsonObject {
  const item = records(data)[0]
  if (!item) {
    throw new HttpError(
      502,
      code,
      'The account service returned an invalid response.',
    )
  }
  return item
}

function provisionTarget(data: unknown): ProvisionTarget {
  const item = firstRow(data, 'invalid_account_target')
  return {
    studentId: text(item.student_id),
    loginId: text(item.login_id),
    authEmail: text(item.auth_email),
    userId: nullableText(item.user_id),
    alreadyProvisioned: item.already_provisioned === true,
  }
}

function completedProvisionTarget(data: unknown): CompletedProvisionTarget {
  const target = provisionTarget(data)
  const item = firstRow(data, 'invalid_account_target')
  return {
    ...target,
    credentialVersion: text(item.credential_version),
    operationId: text(item.operation_id),
    provisioningRequired: item.provisioning_required === true,
  }
}

function resetTarget(data: unknown): CredentialResetTarget {
  const item = firstRow(data, 'invalid_account_target')
  return {
    studentId: text(item.student_id),
    userId: text(item.user_id),
    loginId: text(item.login_id),
    authEmail: text(item.auth_email),
    mustChangePassword: item.must_change_password === true,
    credentialVersion: text(item.credential_version),
    operationId: text(item.operation_id),
  }
}

function accountState(data: unknown): CredentialState {
  const item = firstRow(data, 'invalid_credential_state')
  return {
    userId: text(item.user_id),
    loginId: nullableText(item.login_id),
    mustChangePassword: item.must_change_password === true,
    accountStatus: text(item.account_status) as CredentialState['accountStatus'],
    credentialVersion: text(item.credential_version),
  }
}

function completedCredentialState(data: unknown): {
  userId: string
  mustChangePassword: boolean
  credentialVersion: string
  operationId: string
} {
  const item = firstRow(data, 'invalid_credential_state')
  return {
    userId: text(item.user_id),
    mustChangePassword: item.must_change_password === true,
    credentialVersion: text(item.credential_version),
    operationId: text(item.operation_id),
  }
}

function credentialOperationRow(
  data: unknown,
  expected: {
    userId: string
    credentialVersion: string
    operationId: string
  },
): JsonObject {
  const item = firstRow(data, 'invalid_credential_state')
  if (
    text(item.user_id) !== expected.userId ||
    text(item.credential_version) !== expected.credentialVersion ||
    text(item.operation_id) !== expected.operationId
  ) {
    throw new HttpError(
      502,
      'invalid_credential_state',
      'The account service returned an invalid credential operation.',
    )
  }
  return item
}

function adminAccount(item: JsonObject): AdminStudentAccount {
  return {
    studentId: text(item.student_id),
    fullName: text(item.full_name),
    rollNo: text(item.roll_no),
    batchCode: text(item.batch_code),
    loginId: nullableText(item.login_id),
    mustChangePassword: item.must_change_password === true,
    accountStatus: text(item.account_status) as AdminStudentAccount['accountStatus'],
  }
}

export function createProductionDependencies(
  environment: EnvironmentReader = { get: (name) => Deno.env.get(name) },
): StudentAccountDependencies {
  const supabaseUrl = requiredEnvironment(environment, 'SUPABASE_URL')
  const {
    publishableKey: publicKey,
    secretKey: serviceKey,
  } = resolveSupabaseApiKeys(environment)
  const clientOptions = {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  }
  const authenticationClient = createClient(supabaseUrl, publicKey, clientOptions)
  const serviceClient = createClient(supabaseUrl, serviceKey, clientOptions)

  return {
    allowedOrigins: parseAllowedOrigins(
      environment.get('STUDENT_ACCOUNT_ALLOWED_ORIGINS'),
    ),

    async authenticate(token) {
      const { data, error } = await authenticationClient.auth.getUser(token)
      if (error || !data.user) {
        throw new HttpError(401, 'invalid_token', 'The session is invalid or expired.')
      }
      return { userId: data.user.id }
    },

    async prepareProvision({ actorUserId, studentId }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('prepare_student_account_provision', {
          p_actor_id: actorUserId,
          p_student_id: studentId,
        })
      if (error) throw databaseError(error, 'admin')
      return provisionTarget(data)
    },

    async createAuthUser({ email, password }) {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) throw identityError(error, 'create')
      if (!data.user) {
        throw new HttpError(
          502,
          'invalid_identity_response',
          'The identity service returned an invalid account.',
        )
      }
      return { userId: data.user.id }
    },

    async findAuthUserByEmail(email) {
      for (let page = 1; page <= MAXIMUM_AUTH_USER_PAGES; page += 1) {
        const { data, error } = await serviceClient.auth.admin.listUsers({
          page,
          perPage: AUTH_USERS_PER_PAGE,
        })
        if (error) throw identityError(error, 'lookup')

        const user = data.users.find(
          (candidate) => candidate.email?.toLowerCase() === email,
        )
        if (user) return { userId: user.id }
        if (data.users.length < AUTH_USERS_PER_PAGE) return null
      }
      throw new HttpError(
        502,
        'identity_directory_limit',
        'The identity directory is too large to reconcile safely.',
      )
    },

    async completeProvision({ actorUserId, studentId, userId, operationId }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_student_account_provision', {
          p_actor_id: actorUserId,
          p_student_id: studentId,
          p_user_id: userId,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'admin')
      return completedProvisionTarget(data)
    },

    async completeProvisioningCredential(userId, credentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_provisioning_credential', {
          p_user_id: userId,
          p_expected_credential_version: credentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion,
        operationId,
      })
      if (item.must_change_password !== true || item.provisioning_complete !== true) {
        throw new HttpError(
          502,
          'invalid_credential_state',
          'The account service returned an invalid provisioning state.',
        )
      }
    },

    async cancelProvisioningCredential(userId, credentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('cancel_provisioning_credential', {
          p_user_id: userId,
          p_expected_credential_version: credentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion,
        operationId,
      })
      if (item.cancelled !== true) {
        throw new HttpError(
          409,
          'credential_state_changed',
          'The provisioning operation could not be cancelled safely.',
        )
      }
    },

    async beginCredentialReset({ actorUserId, studentId, operationId }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('begin_student_credential_reset', {
          p_actor_id: actorUserId,
          p_student_id: studentId,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'admin')
      return resetTarget(data)
    },

    async completeCredentialReset(userId, credentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_student_credential_reset', {
          p_user_id: userId,
          p_expected_credential_version: credentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion,
        operationId,
      })
      if (item.must_change_password !== true || item.reset_complete !== true) {
        throw new HttpError(
          502,
          'invalid_credential_state',
          'The account service returned an invalid credential reset state.',
        )
      }
    },

    async failCredentialReset(userId, credentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('fail_student_credential_reset', {
          p_user_id: userId,
          p_expected_credential_version: credentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion,
        operationId,
      })
      if (item.must_change_password !== true || item.reset_failed !== true) {
        throw new HttpError(
          409,
          'credential_state_changed',
          'The failed credential reset could not be recorded safely.',
        )
      }
    },

    async resetAuthPassword({ userId, password }) {
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        password,
      })
      if (error) throw identityError(error, 'update')
    },

    async listAccounts(actorUserId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('admin_student_accounts', { p_actor_id: actorUserId })
      if (error) throw databaseError(error, 'admin')
      return records(data).map(adminAccount)
    },

    async credentialState(userId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('credential_state', { p_user_id: userId })
      if (error) throw databaseError(error, 'state')
      return accountState(data)
    },

    operationId: () => crypto.randomUUID(),

    async beginInitialPasswordChange(userId, expectedCredentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('begin_initial_password_change', {
          p_user_id: userId,
          p_expected_credential_version: expectedCredentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      credentialOperationRow(data, {
        userId,
        credentialVersion: expectedCredentialVersion,
        operationId,
      })
    },

    async updateOwnPassword({ userId, password }) {
      // The handler has authenticated this exact user with Auth getUser and the
      // service-only credential_state RPC has verified the first-login gate.
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        password,
      })
      if (error) throw identityError(error, 'update')
    },

    async completeInitialPasswordChange(
      userId,
      expectedCredentialVersion,
      operationId,
    ) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_initial_password_change', {
          p_user_id: userId,
          p_expected_credential_version: expectedCredentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const completed = completedCredentialState(data)
      if (
        completed.userId !== userId ||
        completed.mustChangePassword ||
        completed.credentialVersion !== expectedCredentialVersion ||
        completed.operationId !== operationId
      ) {
        throw new HttpError(
          502,
          'invalid_credential_state',
          'The account service returned an invalid completed state.',
        )
      }
    },

    async cancelInitialPasswordChange(userId, expectedCredentialVersion, operationId) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('cancel_initial_password_change', {
          p_user_id: userId,
          p_expected_credential_version: expectedCredentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion: expectedCredentialVersion,
        operationId,
      })
      if (item.cancelled !== true) {
        throw new HttpError(
          409,
          'credential_state_changed',
          'The password change operation could not be cancelled safely.',
        )
      }
    },

    async beginFailedPasswordChangeCompensation(
      userId,
      expectedCredentialVersion,
      operationId,
    ) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('begin_failed_password_change_compensation', {
          p_user_id: userId,
          p_expected_credential_version: expectedCredentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = firstRow(data, 'invalid_credential_state')
      if (
        text(item.user_id) !== userId ||
        text(item.operation_id) !== operationId ||
        typeof item.auth_compensation_required !== 'boolean'
      ) {
        throw new HttpError(
          502,
          'invalid_credential_state',
          'The account service returned an invalid compensation state.',
        )
      }
      return {
        authCompensationRequired: item.auth_compensation_required,
        credentialVersion: text(item.credential_version),
      }
    },

    async completeFailedPasswordChangeCompensation(
      userId,
      compensationCredentialVersion,
      operationId,
    ) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_failed_password_change_compensation', {
          p_user_id: userId,
          p_compensation_credential_version: compensationCredentialVersion,
          p_operation_id: operationId,
        })
      if (error) throw databaseError(error, 'complete')
      const item = credentialOperationRow(data, {
        userId,
        credentialVersion: compensationCredentialVersion,
        operationId,
      })
      if (item.must_change_password !== true) {
        throw new HttpError(
          502,
          'invalid_credential_state',
          'The account service returned an invalid compensation result.',
        )
      }
    },

    temporaryPassword: generateTemporaryPassword,
  }
}
