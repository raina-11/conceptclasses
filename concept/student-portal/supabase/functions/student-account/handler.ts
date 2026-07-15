import { passwordPolicyError } from './password.ts'

type ProvisionedAccountStatus = 'active' | 'suspended' | 'disabled'
type AdminAccountStatus = ProvisionedAccountStatus | 'not-provisioned'

export type ProvisionTarget = {
  studentId: string
  loginId: string
  authEmail: string
  userId: string | null
  alreadyProvisioned: boolean
}

export type CompletedProvisionTarget = ProvisionTarget & {
  credentialVersion: string
  operationId: string
  provisioningRequired: boolean
}

export type CredentialResetTarget = {
  studentId: string
  userId: string
  loginId: string
  authEmail: string
  mustChangePassword: boolean
  credentialVersion: string
  operationId: string
}

export type CredentialState = {
  userId: string
  loginId: string | null
  mustChangePassword: boolean
  accountStatus: ProvisionedAccountStatus
  credentialVersion: string
}

export type AdminStudentAccount = {
  studentId: string
  fullName: string
  rollNo: string
  batchCode: string
  loginId: string | null
  mustChangePassword: boolean
  accountStatus: AdminAccountStatus
}

export type StudentAccountDependencies = {
  allowedOrigins: ReadonlySet<string>
  authenticate(token: string): Promise<{ userId: string }>
  prepareProvision(input: {
    actorUserId: string
    studentId: string
  }): Promise<ProvisionTarget>
  findAuthUserByEmail(email: string): Promise<{ userId: string } | null>
  createAuthUser(input: {
    email: string
    password: string
  }): Promise<{ userId: string }>
  completeProvision(input: {
    actorUserId: string
    studentId: string
    userId: string
    operationId: string
  }): Promise<CompletedProvisionTarget>
  completeProvisioningCredential(
    userId: string,
    credentialVersion: string,
    operationId: string,
  ): Promise<void>
  cancelProvisioningCredential(
    userId: string,
    credentialVersion: string,
    operationId: string,
  ): Promise<void>
  beginCredentialReset(input: {
    actorUserId: string
    studentId: string
    operationId: string
  }): Promise<CredentialResetTarget>
  completeCredentialReset(
    userId: string,
    credentialVersion: string,
    operationId: string,
  ): Promise<void>
  failCredentialReset(
    userId: string,
    credentialVersion: string,
    operationId: string,
  ): Promise<void>
  resetAuthPassword(input: { userId: string; password: string }): Promise<void>
  listAccounts(actorUserId: string): Promise<AdminStudentAccount[]>
  credentialState(userId: string): Promise<CredentialState>
  operationId(): string
  beginInitialPasswordChange(
    userId: string,
    expectedCredentialVersion: string,
    operationId: string,
  ): Promise<void>
  updateOwnPassword(input: { userId: string; password: string }): Promise<void>
  completeInitialPasswordChange(
    userId: string,
    expectedCredentialVersion: string,
    operationId: string,
  ): Promise<void>
  cancelInitialPasswordChange(
    userId: string,
    expectedCredentialVersion: string,
    operationId: string,
  ): Promise<void>
  beginFailedPasswordChangeCompensation(
    userId: string,
    expectedCredentialVersion: string,
    operationId: string,
  ): Promise<{
    authCompensationRequired: boolean
    credentialVersion: string
  }>
  completeFailedPasswordChangeCompensation(
    userId: string,
    compensationCredentialVersion: string,
    operationId: string,
  ): Promise<void>
  temporaryPassword(): string
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
const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/
const INTERNAL_AUTH_DOMAIN = 'login.concept.invalid'
const MAXIMUM_REQUEST_BYTES = 8 * 1024
const MAXIMUM_ACCOUNT_ROWS = 10_000

type JsonObject = Record<string, unknown>

function responseHeaders(
  origin: string | null,
  allowedOrigins: ReadonlySet<string>,
): Headers {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    pragma: 'no-cache',
    vary: 'Origin',
    'x-content-type-options': 'nosniff',
  })
  if (origin !== null && allowedOrigins.has(origin)) {
    headers.set('access-control-allow-origin', origin)
  }
  return headers
}

function jsonResponse(body: unknown, status: number, headers: Headers): Response {
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
        message: 'The account operation could not be completed. Please try again.',
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

async function requestBody(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAXIMUM_REQUEST_BYTES) {
    throw new HttpError(413, 'request_too_large', 'The request body is too large.')
  }

  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > MAXIMUM_REQUEST_BYTES) {
    throw new HttpError(413, 'request_too_large', 'The request body is too large.')
  }

  let value: unknown
  try {
    value = JSON.parse(rawBody)
  } catch {
    throw new HttpError(400, 'invalid_request', 'A JSON request body is required.')
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, 'invalid_request', 'A JSON object is required.')
  }
  return value as JsonObject
}

function stringField(body: JsonObject, name: string): string {
  const value = body[name]
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_request', `A valid ${name} is required.`)
  }
  return value
}

function requestedStudentId(body: JsonObject): string {
  const value = stringField(body, 'studentId')
  if (!UUID_PATTERN.test(value)) {
    throw new HttpError(400, 'invalid_student_id', 'A valid student UUID is required.')
  }
  return value
}

function requestedNewPassword(body: JsonObject): string {
  const password = stringField(body, 'newPassword')
  const policyError = passwordPolicyError(password)
  if (policyError) throw new HttpError(400, 'weak_password', policyError)
  return password
}

function validLoginId(value: unknown): value is string {
  return typeof value === 'string' && LOGIN_ID_PATTERN.test(value)
}

function expectedAuthEmail(loginId: string): string {
  return `student.${loginId}@${INTERNAL_AUTH_DOMAIN}`
}

function validateProvisionTarget(
  target: ProvisionTarget,
  requestedStudent: string,
): void {
  const userShapeIsValid = target.alreadyProvisioned
    ? typeof target.userId === 'string' && UUID_PATTERN.test(target.userId)
    : target.userId === null
  if (
    target.studentId !== requestedStudent ||
    !validLoginId(target.loginId) ||
    target.authEmail !== expectedAuthEmail(target.loginId) ||
    !userShapeIsValid
  ) {
    throw new HttpError(
      502,
      'invalid_account_target',
      'The account service returned an invalid provisioning target.',
    )
  }
}

function validateCompletedProvisionTarget(
  target: CompletedProvisionTarget,
  requestedStudent: string,
): void {
  validateProvisionTarget(target, requestedStudent)
  if (
    !target.alreadyProvisioned ||
    !UUID_PATTERN.test(target.credentialVersion) ||
    !UUID_PATTERN.test(target.operationId) ||
    typeof target.provisioningRequired !== 'boolean'
  ) {
    throw new HttpError(
      502,
      'invalid_account_target',
      'The account service returned an invalid completed account.',
    )
  }
}

function validateResetTarget(
  target: CredentialResetTarget,
  requestedStudent: string,
): void {
  if (
    target.studentId !== requestedStudent ||
    !UUID_PATTERN.test(target.userId) ||
    !validLoginId(target.loginId) ||
    target.authEmail !== expectedAuthEmail(target.loginId) ||
    target.mustChangePassword !== true ||
    !UUID_PATTERN.test(target.credentialVersion) ||
    !UUID_PATTERN.test(target.operationId)
  ) {
    throw new HttpError(
      502,
      'invalid_account_target',
      'The account service returned an invalid reset target.',
    )
  }
}

function validateGeneratedPassword(password: string): void {
  if (
    password.length < 14 ||
    password.length > 64 ||
    passwordPolicyError(password) !== null ||
    !/[!@#$%*+?=_-]/.test(password) ||
    /[\s'"`\\]/.test(password)
  ) {
    throw new HttpError(
      500,
      'credential_generation_failed',
      'A secure temporary credential could not be generated.',
    )
  }
}

function textIsValid(value: unknown, minimum: number, maximum: number): value is string {
  const hasControlCharacter = typeof value === 'string' &&
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint < 32 || codePoint === 127
    })
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    value.length >= minimum &&
    value.length <= maximum &&
    !hasControlCharacter
  )
}

function validateAdminAccount(value: AdminStudentAccount): AdminStudentAccount {
  if (
    !UUID_PATTERN.test(value.studentId) ||
    !textIsValid(value.fullName, 1, 200) ||
    !textIsValid(value.rollNo, 1, 64) ||
    !textIsValid(value.batchCode, 1, 64) ||
    (value.loginId !== null && !validLoginId(value.loginId)) ||
    typeof value.mustChangePassword !== 'boolean' ||
    !['active', 'suspended', 'disabled', 'not-provisioned'].includes(
      value.accountStatus,
    )
  ) {
    throw new HttpError(
      502,
      'invalid_account_list',
      'The account service returned an invalid account list.',
    )
  }
  return value
}

async function provisionStudent(
  dependencies: StudentAccountDependencies,
  actorUserId: string,
  studentId: string,
  headers: Headers,
): Promise<Response> {
  const target = await dependencies.prepareProvision({ actorUserId, studentId })
  validateProvisionTarget(target, studentId)
  if (target.alreadyProvisioned) {
    return jsonResponse(
      {
        action: 'provision',
        state: 'already-provisioned',
        studentId: target.studentId,
        loginId: target.loginId,
      },
      200,
      headers,
    )
  }

  const operationId = dependencies.operationId()
  if (!UUID_PATTERN.test(operationId)) {
    throw new HttpError(
      500,
      'operation_generation_failed',
      'A secure account operation could not be generated.',
    )
  }

  let identity = await dependencies.findAuthUserByEmail(target.authEmail)
  if (identity !== null && !UUID_PATTERN.test(identity.userId)) {
    throw new HttpError(
      502,
      'invalid_identity_response',
      'The identity service returned an invalid account.',
    )
  }

  if (identity !== null) {
    // A previous attempt may have created Auth successfully before its database
    // response or linking transaction failed. The database claim below decides
    // which exact operation is allowed to rotate that identity.
  } else {
    const bootstrapPassword = dependencies.temporaryPassword()
    validateGeneratedPassword(bootstrapPassword)
    try {
      identity = await dependencies.createAuthUser({
        email: target.authEmail,
        password: bootstrapPassword,
      })
    } catch (creationError) {
      // An Auth create response can be lost after the identity commits. A
      // deterministic exact-email lookup distinguishes that case on retry.
      let recovered: { userId: string } | null = null
      try {
        recovered = await dependencies.findAuthUserByEmail(target.authEmail)
      } catch {
        throw creationError
      }
      if (recovered === null) throw creationError
      identity = recovered
      if (!UUID_PATTERN.test(identity.userId)) {
        throw new HttpError(
          502,
          'invalid_identity_response',
          'The identity service returned an invalid account.',
        )
      }
    }
  }

  if (!UUID_PATTERN.test(identity.userId)) {
    throw new HttpError(
      502,
      'invalid_identity_response',
      'The identity service returned an invalid account.',
    )
  }

  let completed: CompletedProvisionTarget
  try {
    completed = await dependencies.completeProvision({
      actorUserId,
      studentId,
      userId: identity.userId,
      operationId,
    })
  } catch (firstError) {
    // The same operation id makes one retry safe when the binding committed but
    // its response was lost. A different live operation is rejected by the DB.
    try {
      completed = await dependencies.completeProvision({
        actorUserId,
        studentId,
        userId: identity.userId,
        operationId,
      })
    } catch {
      throw firstError
    }
  }
  validateCompletedProvisionTarget(completed, studentId)
  if (
    completed.userId !== identity.userId ||
    completed.loginId !== target.loginId ||
    completed.authEmail !== target.authEmail ||
    completed.operationId !== operationId
  ) {
    throw new HttpError(
      502,
      'invalid_account_target',
      'The account service returned an invalid completed account.',
    )
  }

  if (!completed.provisioningRequired) {
    return jsonResponse(
      {
        action: 'provision',
        state: 'already-provisioned',
        studentId: target.studentId,
        loginId: target.loginId,
      },
      200,
      headers,
    )
  }

  const password = dependencies.temporaryPassword()
  validateGeneratedPassword(password)

  try {
    await dependencies.resetAuthPassword({ userId: identity.userId, password })
  } catch (error) {
    try {
      await dependencies.cancelProvisioningCredential(
        identity.userId,
        completed.credentialVersion,
        operationId,
      )
    } catch {
      // The lease remains fail-closed and expires server-side if cancellation
      // itself is unavailable.
    }
    throw error
  }

  try {
    await dependencies.completeProvisioningCredential(
      identity.userId,
      completed.credentialVersion,
      operationId,
    )
  } catch (firstError) {
    try {
      await dependencies.completeProvisioningCredential(
        identity.userId,
        completed.credentialVersion,
        operationId,
      )
    } catch {
      throw firstError
    }
  }

  return jsonResponse(
    {
      action: 'provision',
      state: 'provisioned',
      studentId: target.studentId,
      loginId: target.loginId,
      temporaryPassword: password,
    },
    201,
    headers,
  )
}

function passwordChangeInterrupted(): HttpError {
  return new HttpError(
    409,
    'password_change_interrupted',
    'The password change was interrupted. Ask an administrator for a new temporary password.',
  )
}

async function compensateFailedPasswordChange(
  dependencies: StudentAccountDependencies,
  userId: string,
  credentialVersion: string,
  operationId: string,
): Promise<never> {
  let decision: {
    authCompensationRequired: boolean
    credentialVersion: string
  }
  try {
    decision = await dependencies.beginFailedPasswordChangeCompensation(
      userId,
      credentialVersion,
      operationId,
    )
  } catch {
    throw passwordChangeInterrupted()
  }

  if (!UUID_PATTERN.test(decision.credentialVersion)) {
    throw passwordChangeInterrupted()
  }
  if (!decision.authCompensationRequired) {
    // A newer reset or completed operation won. Never overwrite its Auth
    // password with compensation for this stale request.
    throw passwordChangeInterrupted()
  }

  try {
    const undisclosedPassword = dependencies.temporaryPassword()
    validateGeneratedPassword(undisclosedPassword)
    await dependencies.resetAuthPassword({
      userId,
      password: undisclosedPassword,
    })
    await dependencies.completeFailedPasswordChangeCompensation(
      userId,
      decision.credentialVersion,
      operationId,
    )
  } catch {
    // The database remains fail-closed in compensating state. This generated
    // password is deliberately never returned or logged.
  }
  throw passwordChangeInterrupted()
}

async function resetStudent(
  dependencies: StudentAccountDependencies,
  actorUserId: string,
  studentId: string,
  headers: Headers,
): Promise<Response> {
  const password = dependencies.temporaryPassword()
  validateGeneratedPassword(password)
  const operationId = dependencies.operationId()
  if (!UUID_PATTERN.test(operationId)) {
    throw new HttpError(
      500,
      'operation_generation_failed',
      'A secure credential operation could not be generated.',
    )
  }

  // The reset lease gates portal data and blocks a student password-change
  // claim until the exact Auth update is finalized or marked failed.
  const target = await dependencies.beginCredentialReset({
    actorUserId,
    studentId,
    operationId,
  })
  validateResetTarget(target, studentId)
  if (target.operationId !== operationId) {
    throw new HttpError(
      502,
      'invalid_account_target',
      'The account service returned an invalid reset operation.',
    )
  }

  try {
    await dependencies.resetAuthPassword({ userId: target.userId, password })
  } catch (error) {
    try {
      await dependencies.failCredentialReset(
        target.userId,
        target.credentialVersion,
        operationId,
      )
    } catch {
      // Resetting/reset-failed states both keep the data gate closed. A later
      // administrator reset can recover this operation server-side.
    }
    throw error
  }

  try {
    await dependencies.completeCredentialReset(
      target.userId,
      target.credentialVersion,
      operationId,
    )
  } catch (firstError) {
    try {
      await dependencies.completeCredentialReset(
        target.userId,
        target.credentialVersion,
        operationId,
      )
    } catch {
      try {
        await dependencies.failCredentialReset(
          target.userId,
          target.credentialVersion,
          operationId,
        )
      } catch {
        // The database lease remains fail-closed when failure marking is
        // unavailable.
      }
      throw firstError
    }
  }
  return jsonResponse(
    {
      action: 'reset',
      state: 'reset-required',
      studentId: target.studentId,
      loginId: target.loginId,
      temporaryPassword: password,
    },
    200,
    headers,
  )
}

async function changeInitialPassword(
  dependencies: StudentAccountDependencies,
  userId: string,
  password: string,
  headers: Headers,
): Promise<Response> {
  const state = await dependencies.credentialState(userId)
  if (
    state.userId !== userId ||
    !UUID_PATTERN.test(state.userId) ||
    !UUID_PATTERN.test(state.credentialVersion)
  ) {
    throw new HttpError(
      502,
      'invalid_credential_state',
      'The account service returned an invalid credential state.',
    )
  }
  if (state.accountStatus !== 'active') {
    throw new HttpError(403, 'account_unavailable', 'This account is not active.')
  }
  if (!state.mustChangePassword) {
    throw new HttpError(
      409,
      'password_change_not_required',
      'This account does not require an initial password change.',
    )
  }

  const operationId = dependencies.operationId()
  if (!UUID_PATTERN.test(operationId)) {
    throw new HttpError(
      500,
      'operation_generation_failed',
      'A secure credential operation could not be generated.',
    )
  }

  await dependencies.beginInitialPasswordChange(
    userId,
    state.credentialVersion,
    operationId,
  )
  try {
    await dependencies.updateOwnPassword({ userId, password })
  } catch (error) {
    try {
      await dependencies.cancelInitialPasswordChange(
        userId,
        state.credentialVersion,
        operationId,
      )
    } catch {
      // A failed cancellation leaves the data gate closed until lease expiry.
    }
    throw error
  }
  // Completion is service-only, so a browser cannot clear the gate without a
  // successful Auth password update in this function.
  try {
    await dependencies.completeInitialPasswordChange(
      userId,
      state.credentialVersion,
      operationId,
    )
  } catch {
    return await compensateFailedPasswordChange(
      dependencies,
      userId,
      state.credentialVersion,
      operationId,
    )
  }
  return jsonResponse(
    { action: 'change-initial-password', state: 'active' },
    200,
    headers,
  )
}

export function createStudentAccountHandler(
  dependencies: StudentAccountDependencies,
) {
  return async function studentAccount(request: Request): Promise<Response> {
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
      const body = await requestBody(request)
      const action = stringField(body, 'action')
      if (!['list', 'provision', 'reset', 'change-initial-password'].includes(action)) {
        throw new HttpError(400, 'invalid_action', 'The requested account action is invalid.')
      }

      const authenticated = await dependencies.authenticate(token)
      if (!UUID_PATTERN.test(authenticated.userId)) {
        throw new HttpError(401, 'invalid_token', 'The session is invalid or expired.')
      }

      if (action === 'list') {
        const accounts = await dependencies.listAccounts(authenticated.userId)
        if (!Array.isArray(accounts) || accounts.length > MAXIMUM_ACCOUNT_ROWS) {
          throw new HttpError(
            502,
            'invalid_account_list',
            'The account service returned an invalid account list.',
          )
        }
        return jsonResponse(
          { accounts: accounts.map(validateAdminAccount) },
          200,
          headers,
        )
      }

      if (action === 'provision') {
        return await provisionStudent(
          dependencies,
          authenticated.userId,
          requestedStudentId(body),
          headers,
        )
      }
      if (action === 'reset') {
        return await resetStudent(
          dependencies,
          authenticated.userId,
          requestedStudentId(body),
          headers,
        )
      }
      return await changeInitialPassword(
        dependencies,
        authenticated.userId,
        requestedNewPassword(body),
        headers,
      )
    } catch (error) {
      return errorResponse(error, headers)
    }
  }
}
