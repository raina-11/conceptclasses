import { describe, expect, it, vi } from 'vitest'
import {
  createStudentAccountHandler,
  HttpError,
  type StudentAccountDependencies,
} from './handler.ts'
import { parseAllowedOrigins } from './origins.ts'
import {
  generateTemporaryPassword,
  passwordPolicyError,
} from './password.ts'

const origin = 'https://students.conceptinstitute.co.in'
const actorUserId = '10000000-0000-4000-8000-000000000001'
const studentId = '20000000-0000-4000-8000-000000000002'
const unprovisionedStudentId = '20000000-0000-4000-8000-000000000004'
const studentUserId = '30000000-0000-4000-8000-000000000003'
const loginId = 'batch-b-0012'
const authEmail = `student.${loginId}@login.concept.invalid`
const bootstrapPassword = 'B00tstrap!Passw0rd'
const temporaryPassword = 'T3mporary!Passw0rd'
const credentialVersion = '40000000-0000-4000-8000-000000000004'
const resetCredentialVersion = '40000000-0000-4000-8000-000000000005'
const operationId = '50000000-0000-4000-8000-000000000005'
const compensationVersion = '60000000-0000-4000-8000-000000000006'

function dependencies(
  overrides: Partial<StudentAccountDependencies> = {},
): StudentAccountDependencies {
  return {
    allowedOrigins: new Set([origin, 'http://127.0.0.1:4173']),
    authenticate: vi.fn().mockResolvedValue({ userId: actorUserId }),
    prepareProvision: vi.fn().mockResolvedValue({
      studentId,
      loginId,
      authEmail,
      userId: null,
      alreadyProvisioned: false,
    }),
    findAuthUserByEmail: vi.fn().mockResolvedValue(null),
    createAuthUser: vi.fn().mockResolvedValue({ userId: studentUserId }),
    completeProvision: vi.fn().mockResolvedValue({
      studentId,
      loginId,
      authEmail,
      userId: studentUserId,
      alreadyProvisioned: true,
      credentialVersion,
      operationId,
      provisioningRequired: true,
    }),
    completeProvisioningCredential: vi.fn().mockResolvedValue(undefined),
    cancelProvisioningCredential: vi.fn().mockResolvedValue(undefined),
    beginCredentialReset: vi.fn().mockResolvedValue({
      studentId,
      userId: studentUserId,
      loginId,
      authEmail,
      mustChangePassword: true,
      credentialVersion: resetCredentialVersion,
      operationId,
    }),
    completeCredentialReset: vi.fn().mockResolvedValue(undefined),
    failCredentialReset: vi.fn().mockResolvedValue(undefined),
    resetAuthPassword: vi.fn().mockResolvedValue(undefined),
    listAccounts: vi.fn().mockResolvedValue([
      {
        studentId,
        fullName: 'Synthetic Student',
        rollNo: '0012',
        batchCode: '9M',
        loginId,
        mustChangePassword: true,
        accountStatus: 'active',
      },
      {
        studentId: unprovisionedStudentId,
        fullName: 'Unprovisioned Student',
        rollNo: 'ALPHA12',
        batchCode: 'Batch B',
        loginId: null,
        mustChangePassword: false,
        accountStatus: 'not-provisioned',
      },
    ]),
    credentialState: vi.fn().mockResolvedValue({
      userId: actorUserId,
      loginId,
      mustChangePassword: true,
      accountStatus: 'active',
      credentialVersion,
    }),
    operationId: vi.fn().mockReturnValue(operationId),
    beginInitialPasswordChange: vi.fn().mockResolvedValue(undefined),
    updateOwnPassword: vi.fn().mockResolvedValue(undefined),
    completeInitialPasswordChange: vi.fn().mockResolvedValue(undefined),
    cancelInitialPasswordChange: vi.fn().mockResolvedValue(undefined),
    beginFailedPasswordChangeCompensation: vi.fn().mockResolvedValue({
      authCompensationRequired: true,
      credentialVersion: compensationVersion,
    }),
    completeFailedPasswordChangeCompensation: vi.fn().mockResolvedValue(undefined),
    temporaryPassword: vi.fn().mockReturnValue(temporaryPassword),
    ...overrides,
  }
}

function request(body: unknown, init: RequestInit = {}) {
  return new Request('https://functions.example.invalid/student-account', {
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

describe('student-account origins and credentials', () => {
  it('allows only exact HTTPS production and HTTP loopback origins', () => {
    expect(
      parseAllowedOrigins('https://students.conceptinstitute.co.in,http://localhost:4173'),
    ).toEqual(
      new Set([
        'https://students.conceptinstitute.co.in',
        'http://localhost:4173',
      ]),
    )
    expect(() => parseAllowedOrigins('*')).toThrow('exact HTTP(S) origins')
    expect(() => parseAllowedOrigins('http://students.conceptinstitute.co.in')).toThrow(
      'Invalid exact origin',
    )
    expect(() => parseAllowedOrigins('https://students.conceptinstitute.co.in/path')).toThrow(
      'Invalid exact origin',
    )
    expect(parseAllowedOrigins(undefined)).toContain('http://127.0.0.1:4173')
  })

  it('generates strong printable temporary passwords without predictable defaults', () => {
    let sequence = 0
    const password = generateTemporaryPassword(18, (maximum) => {
      const next = sequence % maximum
      sequence += 1
      return next
    })

    expect(password).toHaveLength(18)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#$%*+?=_-]/)
    expect(password).not.toMatch(/[\s'"`\\]/)
  })

  it('enforces the hosted password policy before handling a secret', () => {
    expect(passwordPolicyError('shortA1')).not.toBeNull()
    expect(passwordPolicyError('alllowercase123')).not.toBeNull()
    expect(passwordPolicyError('ALLUPPERCASE123')).not.toBeNull()
    expect(passwordPolicyError('NoDigitsAnywhere')).not.toBeNull()
    expect(passwordPolicyError('SecurePass9')).toBeNull()
    expect(passwordPolicyError(`SecurePass9${'x'.repeat(120)}`)).not.toBeNull()
  })
})

describe('student-account handler', () => {
  it('answers approved CORS preflight without authenticating', async () => {
    const deps = dependencies()
    const response = await createStudentAccountHandler(deps)(
      new Request('https://functions.example.invalid/student-account', {
        method: 'OPTIONS',
        headers: { origin },
      }),
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(origin)
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
    expect(deps.authenticate).not.toHaveBeenCalled()
  })

  it('rejects an unapproved origin before authentication', async () => {
    const deps = dependencies()
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'reset', studentId }, {
        headers: { origin: 'https://attacker.invalid' },
      }),
    )

    expect(response.status).toBe(403)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    expect(deps.authenticate).not.toHaveBeenCalled()
  })

  it('requires POST, a bearer token, and a bounded JSON request', async () => {
    const handler = createStudentAccountHandler(dependencies())
    const wrongMethod = await handler(
      new Request('https://functions.example.invalid/student-account', {
        method: 'GET',
        headers: { origin },
      }),
    )
    const missingToken = await handler(
      request({ action: 'reset', studentId }, {
        headers: { origin, 'content-type': 'application/json' },
      }),
    )
    const oversized = await handler(
      request({ action: 'change-initial-password', newPassword: 'A1' + 'x'.repeat(9_000) }),
    )

    expect(wrongMethod.status).toBe(405)
    expect(missingToken.status).toBe(401)
    expect(oversized.status).toBe(413)
  })

  it('provisions a student through the admin-authorizing RPC and Admin API', async () => {
    const freshTemporaryPassword = vi.fn()
      .mockReturnValueOnce(bootstrapPassword)
      .mockReturnValueOnce(temporaryPassword)
    const deps = dependencies({ temporaryPassword: freshTemporaryPassword })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(201)
    const responseBody = await response.json()
    expect(responseBody).toEqual({
      action: 'provision',
      state: 'provisioned',
      studentId,
      loginId,
      temporaryPassword,
    })
    expect(deps.prepareProvision).toHaveBeenCalledWith({
      actorUserId,
      studentId,
    })
    expect(deps.createAuthUser).toHaveBeenCalledWith({
      email: authEmail,
      password: bootstrapPassword,
    })
    expect(deps.findAuthUserByEmail).toHaveBeenCalledWith(authEmail)
    expect(deps.completeProvision).toHaveBeenCalledWith({
      actorUserId,
      studentId,
      userId: studentUserId,
      operationId,
    })
    expect(deps.completeProvisioningCredential).toHaveBeenCalledWith(
      studentUserId,
      credentialVersion,
      operationId,
    )
    expect(deps.resetAuthPassword).toHaveBeenCalledWith({
      userId: studentUserId,
      password: temporaryPassword,
    })
    expect(vi.mocked(deps.completeProvision).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deps.resetAuthPassword).mock.invocationCallOrder[0],
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(JSON.stringify(responseBody)).not.toContain(authEmail)
  })

  it('does not rotate or reveal credentials for an idempotent provision retry', async () => {
    const deps = dependencies({
      prepareProvision: vi.fn().mockResolvedValue({
        studentId,
        loginId,
        authEmail,
        userId: studentUserId,
        alreadyProvisioned: true,
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: 'provision',
      state: 'already-provisioned',
      studentId,
      loginId,
    })
    expect(deps.temporaryPassword).not.toHaveBeenCalled()
    expect(deps.findAuthUserByEmail).not.toHaveBeenCalled()
    expect(deps.createAuthUser).not.toHaveBeenCalled()
    expect(deps.completeProvision).not.toHaveBeenCalled()
  })

  it('reconciles a committed provision when the completion response is lost', async () => {
    const completeProvision = vi.fn()
      .mockRejectedValueOnce(
        new HttpError(502, 'account_service_unavailable', 'The completion response was lost.'),
      )
      .mockResolvedValueOnce({
        studentId,
        loginId,
        authEmail,
        userId: studentUserId,
        alreadyProvisioned: true,
        credentialVersion,
        operationId,
        provisioningRequired: true,
      })
    const deps = dependencies({
      completeProvision,
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(201)
    expect(completeProvision).toHaveBeenCalledTimes(2)
    await expect(response.json()).resolves.toEqual({
      action: 'provision',
      state: 'provisioned',
      studentId,
      loginId,
      temporaryPassword,
    })
  })

  it('reuses an orphaned Auth identity with a fresh random temporary password', async () => {
    const deps = dependencies({
      findAuthUserByEmail: vi.fn().mockResolvedValue({ userId: studentUserId }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(201)
    expect(deps.createAuthUser).not.toHaveBeenCalled()
    expect(deps.resetAuthPassword).toHaveBeenCalledWith({
      userId: studentUserId,
      password: temporaryPassword,
    })
    const body = await response.json()
    expect(body).toEqual({
      action: 'provision',
      state: 'provisioned',
      studentId,
      loginId,
      temporaryPassword,
    })
    expect(JSON.stringify(body)).not.toContain(authEmail)
  })

  it('never rewrites Auth or returns a credential for an already-finalized operation', async () => {
    const deps = dependencies({
      findAuthUserByEmail: vi.fn().mockResolvedValue({ userId: studentUserId }),
      completeProvision: vi.fn().mockResolvedValue({
        studentId,
        loginId,
        authEmail,
        userId: studentUserId,
        alreadyProvisioned: true,
        credentialVersion,
        operationId,
        provisioningRequired: false,
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(200)
    expect(deps.temporaryPassword).not.toHaveBeenCalled()
    expect(deps.resetAuthPassword).not.toHaveBeenCalled()
    expect(deps.completeProvisioningCredential).not.toHaveBeenCalled()
    const body = await response.json()
    expect(body).toEqual({
      action: 'provision',
      state: 'already-provisioned',
      studentId,
      loginId,
    })
    expect(JSON.stringify(body)).not.toContain(temporaryPassword)
    expect(JSON.stringify(body)).not.toContain(authEmail)
  })

  it('recovers when Auth creation commits but its response is lost', async () => {
    const findAuthUserByEmail = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: studentUserId })
    const deps = dependencies({
      findAuthUserByEmail,
      createAuthUser: vi.fn().mockRejectedValue(
        new HttpError(502, 'identity_service_unavailable', 'The creation response was lost.'),
      ),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(201)
    expect(findAuthUserByEmail).toHaveBeenCalledTimes(2)
    expect(deps.resetAuthPassword).toHaveBeenCalledWith({
      userId: studentUserId,
      password: temporaryPassword,
    })
    const body = await response.json()
    expect(body).toMatchObject({
      state: 'provisioned',
      studentId,
      loginId,
      temporaryPassword,
    })
    expect(JSON.stringify(body)).not.toContain(authEmail)
  })

  it('keeps a proven uncommitted Auth identity recoverable for a later retry', async () => {
    const deps = dependencies({
      completeProvision: vi.fn().mockRejectedValue(
        new HttpError(409, 'account_conflict', 'The account mapping conflicts with existing data.'),
      ),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(409)
    expect(deps.prepareProvision).toHaveBeenCalledTimes(1)
    expect(deps.completeProvision).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(await response.json())).not.toContain(temporaryPassword)
  })

  it('fails closed if a privileged RPC returns an unexpected internal identity', async () => {
    const deps = dependencies({
      prepareProvision: vi.fn().mockResolvedValue({
        studentId,
        loginId,
        authEmail: 'attacker@example.com',
        userId: null,
        alreadyProvisioned: false,
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'provision', studentId }),
    )

    expect(response.status).toBe(502)
    expect(deps.createAuthUser).not.toHaveBeenCalled()
  })

  it('gates an account in the database before resetting its Auth password', async () => {
    const order: string[] = []
    const deps = dependencies({
      beginCredentialReset: vi.fn().mockImplementation(() => {
        order.push('database-gated')
        return Promise.resolve({
          studentId,
          userId: studentUserId,
          loginId,
          authEmail,
          mustChangePassword: true,
          credentialVersion: resetCredentialVersion,
          operationId,
        })
      }),
      resetAuthPassword: vi.fn().mockImplementation(() => {
        order.push('auth-reset')
        return Promise.resolve()
      }),
      completeCredentialReset: vi.fn().mockImplementation(() => {
        order.push('database-finalized')
        return Promise.resolve()
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'reset', studentId }),
    )

    expect(response.status).toBe(200)
    expect(order).toEqual(['database-gated', 'auth-reset', 'database-finalized'])
    expect(deps.beginCredentialReset).toHaveBeenCalledWith({
      actorUserId,
      studentId,
      operationId,
    })
    expect(deps.resetAuthPassword).toHaveBeenCalledWith({
      userId: studentUserId,
      password: temporaryPassword,
    })
    expect(deps.completeCredentialReset).toHaveBeenCalledWith(
      studentUserId,
      resetCredentialVersion,
      operationId,
    )
    await expect(response.json()).resolves.toEqual({
      action: 'reset',
      state: 'reset-required',
      studentId,
      loginId,
      temporaryPassword,
    })
  })

  it('never returns the generated reset secret when the Auth update fails', async () => {
    const deps = dependencies({
      resetAuthPassword: vi.fn().mockRejectedValue(
        new HttpError(502, 'identity_service_unavailable', 'The identity service is unavailable.'),
      ),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'reset', studentId }),
    )

    expect(response.status).toBe(502)
    expect(deps.failCredentialReset).toHaveBeenCalledWith(
      studentUserId,
      resetCredentialVersion,
      operationId,
    )
    expect(deps.completeCredentialReset).not.toHaveBeenCalled()
    const body = JSON.stringify(await response.json())
    expect(body).not.toContain(temporaryPassword)
    expect(body).not.toContain(authEmail)
  })

  it('does not return a reset password unless exact-op finalization succeeds', async () => {
    const deps = dependencies({
      completeCredentialReset: vi.fn().mockRejectedValue(
        new HttpError(502, 'account_service_unavailable', 'The final response was lost.'),
      ),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'reset', studentId }),
    )

    expect(response.status).toBe(502)
    expect(deps.completeCredentialReset).toHaveBeenCalledTimes(2)
    expect(deps.failCredentialReset).toHaveBeenCalledWith(
      studentUserId,
      resetCredentialVersion,
      operationId,
    )
    expect(JSON.stringify(await response.json())).not.toContain(temporaryPassword)
  })

  it('lists student account state only through the admin-authorizing RPC', async () => {
    const deps = dependencies()
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'list' }),
    )

    expect(response.status).toBe(200)
    expect(deps.listAccounts).toHaveBeenCalledWith(actorUserId)
    await expect(response.json()).resolves.toEqual({
      accounts: [
        {
          studentId,
          fullName: 'Synthetic Student',
          rollNo: '0012',
          batchCode: '9M',
          loginId,
          mustChangePassword: true,
          accountStatus: 'active',
        },
        {
          studentId: unprovisionedStudentId,
          fullName: 'Unprovisioned Student',
          rollNo: 'ALPHA12',
          batchCode: 'Batch B',
          loginId: null,
          mustChangePassword: false,
          accountStatus: 'not-provisioned',
        },
      ],
    })
  })

  it('changes the signed-in initial password before completing the server-only state transition', async () => {
    const order: string[] = []
    const deps = dependencies({
      beginInitialPasswordChange: vi.fn().mockImplementation(() => {
        order.push('database-claimed')
        return Promise.resolve()
      }),
      updateOwnPassword: vi.fn().mockImplementation(() => {
        order.push('auth-password-changed')
        return Promise.resolve()
      }),
      completeInitialPasswordChange: vi.fn().mockImplementation(() => {
        order.push('database-completed')
        return Promise.resolve()
      }),
    })
    const newPassword = 'A-Stronger-Pass9'
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword }),
    )

    expect(response.status).toBe(200)
    expect(order).toEqual([
      'database-claimed',
      'auth-password-changed',
      'database-completed',
    ])
    expect(deps.credentialState).toHaveBeenCalledWith(actorUserId)
    expect(deps.updateOwnPassword).toHaveBeenCalledWith({
      userId: actorUserId,
      password: newPassword,
    })
    expect(deps.beginInitialPasswordChange).toHaveBeenCalledWith(
      actorUserId,
      credentialVersion,
      operationId,
    )
    expect(deps.completeInitialPasswordChange).toHaveBeenCalledWith(
      actorUserId,
      credentialVersion,
      operationId,
    )
    await expect(response.json()).resolves.toEqual({
      action: 'change-initial-password',
      state: 'active',
    })
  })

  it('does not change a password unless the authenticated account is active and gated', async () => {
    const deps = dependencies({
      credentialState: vi.fn().mockResolvedValue({
        userId: actorUserId,
        loginId,
        mustChangePassword: false,
        accountStatus: 'active',
        credentialVersion,
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(409)
    expect(deps.updateOwnPassword).not.toHaveBeenCalled()
    expect(deps.completeInitialPasswordChange).not.toHaveBeenCalled()
  })

  it('compensates with an undisclosed password when completion loses its CAS', async () => {
    const order: string[] = []
    const deps = dependencies({
      updateOwnPassword: vi.fn().mockImplementation(() => {
        order.push('auth-password-changed')
        return Promise.resolve()
      }),
      completeInitialPasswordChange: vi.fn().mockImplementation(() => {
        order.push('stale-version-rejected')
        return Promise.reject(
          new HttpError(
            409,
            'credential_state_changed',
            'The credential state changed. Ask an administrator for a new temporary password.',
          ),
        )
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(409)
    expect(order).toEqual(['auth-password-changed', 'stale-version-rejected'])
    expect(deps.completeInitialPasswordChange).toHaveBeenCalledWith(
      actorUserId,
      credentialVersion,
      operationId,
    )
    expect(deps.beginFailedPasswordChangeCompensation).toHaveBeenCalledWith(
      actorUserId,
      credentialVersion,
      operationId,
    )
    expect(deps.resetAuthPassword).toHaveBeenCalledWith({
      userId: actorUserId,
      password: temporaryPassword,
    })
    expect(deps.completeFailedPasswordChangeCompensation).toHaveBeenCalledWith(
      actorUserId,
      compensationVersion,
      operationId,
    )
    const body = await response.json()
    expect(body).toEqual({
      error: {
        code: 'password_change_interrupted',
        message: 'The password change was interrupted. Ask an administrator for a new temporary password.',
      },
    })
    expect(JSON.stringify(body)).not.toContain(temporaryPassword)
  })

  it('does not overwrite Auth when a later credential generation already won', async () => {
    const deps = dependencies({
      completeInitialPasswordChange: vi.fn().mockRejectedValue(
        new HttpError(502, 'account_service_unavailable', 'The response was lost.'),
      ),
      beginFailedPasswordChangeCompensation: vi.fn().mockResolvedValue({
        authCompensationRequired: false,
        credentialVersion: resetCredentialVersion,
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(409)
    expect(deps.resetAuthPassword).not.toHaveBeenCalled()
    expect(deps.completeFailedPasswordChangeCompensation).not.toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain(temporaryPassword)
  })

  it('keeps the account gated when compensation credential generation fails', async () => {
    const deps = dependencies({
      completeInitialPasswordChange: vi.fn().mockRejectedValue(
        new HttpError(502, 'account_service_unavailable', 'The response was lost.'),
      ),
      temporaryPassword: vi.fn(() => {
        throw new Error('random source unavailable')
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'password_change_interrupted',
        message: 'The password change was interrupted. Ask an administrator for a new temporary password.',
      },
    })
    expect(deps.resetAuthPassword).not.toHaveBeenCalled()
    expect(deps.completeFailedPasswordChangeCompensation).not.toHaveBeenCalled()
  })

  it('releases its database claim when the Auth password update fails', async () => {
    const authError = new HttpError(
      502,
      'identity_service_unavailable',
      'The identity service is unavailable.',
    )
    const deps = dependencies({
      updateOwnPassword: vi.fn().mockRejectedValue(authError),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(502)
    expect(deps.cancelInitialPasswordChange).toHaveBeenCalledWith(
      actorUserId,
      credentialVersion,
      operationId,
    )
    expect(deps.completeInitialPasswordChange).not.toHaveBeenCalled()
  })

  it('refuses an invalid credential version before changing the Auth password', async () => {
    const deps = dependencies({
      credentialState: vi.fn().mockResolvedValue({
        userId: actorUserId,
        loginId,
        mustChangePassword: true,
        accountStatus: 'active',
        credentialVersion: 'not-a-uuid',
      }),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(502)
    expect(deps.updateOwnPassword).not.toHaveBeenCalled()
    expect(deps.completeInitialPasswordChange).not.toHaveBeenCalled()
  })

  it('refuses an invalid password-change operation id before claiming state', async () => {
    const deps = dependencies({
      operationId: vi.fn().mockReturnValue('not-a-uuid'),
    })
    const response = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'A-Stronger-Pass9' }),
    )

    expect(response.status).toBe(500)
    expect(deps.beginInitialPasswordChange).not.toHaveBeenCalled()
    expect(deps.updateOwnPassword).not.toHaveBeenCalled()
  })

  it('rejects weak passwords and malformed account targets without exposing backend details', async () => {
    const deps = dependencies()
    const weak = await createStudentAccountHandler(deps)(
      request({ action: 'change-initial-password', newPassword: 'password' }),
    )
    const invalidStudent = await createStudentAccountHandler(deps)(
      request({ action: 'reset', studentId: 'not-a-uuid' }),
    )
    const invalidAction = await createStudentAccountHandler(deps)(
      request({ action: 'inspect', studentId }),
    )

    expect(weak.status).toBe(400)
    expect(invalidStudent.status).toBe(400)
    expect(invalidAction.status).toBe(400)
    expect(deps.updateOwnPassword).not.toHaveBeenCalled()
    expect(deps.beginCredentialReset).not.toHaveBeenCalled()
    expect(deps.prepareProvision).not.toHaveBeenCalled()
  })
})
