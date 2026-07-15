import {
  createStudentAccountHandler,
  type StudentAccountDependencies,
} from './handler.ts'
import { parseAllowedOrigins } from './origins.ts'
import { generateTemporaryPassword } from './password.ts'

const origin = 'https://students.conceptinstitute.co.in'
const actorUserId = '10000000-0000-4000-8000-000000000001'
const studentId = '20000000-0000-4000-8000-000000000002'
const studentUserId = '30000000-0000-4000-8000-000000000003'
const loginId = 'batch-b-0012'
const authEmail = `student.${loginId}@login.concept.invalid`
const temporaryPassword = 'T3mporary!Passw0rd'
const credentialVersion = '40000000-0000-4000-8000-000000000004'
const operationId = '50000000-0000-4000-8000-000000000005'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertEquals(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, received ${actualJson}`)
  }
}

function dependencies(
  overrides: Partial<StudentAccountDependencies> = {},
): StudentAccountDependencies {
  return {
    allowedOrigins: new Set([origin]),
    authenticate: () => Promise.resolve({ userId: actorUserId }),
    prepareProvision: () => Promise.resolve({
      studentId,
      loginId,
      authEmail,
      userId: null,
      alreadyProvisioned: false,
    }),
    findAuthUserByEmail: () => Promise.resolve(null),
    createAuthUser: () => Promise.resolve({ userId: studentUserId }),
    completeProvision: () => Promise.resolve({
      studentId,
      loginId,
      authEmail,
      userId: studentUserId,
      alreadyProvisioned: true,
      credentialVersion,
      operationId,
      provisioningRequired: true,
    }),
    completeProvisioningCredential: () => Promise.resolve(),
    cancelProvisioningCredential: () => Promise.resolve(),
    beginCredentialReset: () => Promise.resolve({
      studentId,
      userId: studentUserId,
      loginId,
      authEmail,
      mustChangePassword: true,
      credentialVersion,
      operationId,
    }),
    completeCredentialReset: () => Promise.resolve(),
    failCredentialReset: () => Promise.resolve(),
    resetAuthPassword: () => Promise.resolve(),
    listAccounts: () => Promise.resolve([{
      studentId,
      fullName: 'Synthetic Student',
      rollNo: '0012',
      batchCode: '9M',
      loginId,
      mustChangePassword: true,
      accountStatus: 'active',
    }]),
    credentialState: () => Promise.resolve({
      userId: actorUserId,
      loginId,
      mustChangePassword: true,
      accountStatus: 'active',
      credentialVersion,
    }),
    operationId: () => operationId,
    beginInitialPasswordChange: () => Promise.resolve(),
    updateOwnPassword: () => Promise.resolve(),
    completeInitialPasswordChange: () => Promise.resolve(),
    cancelInitialPasswordChange: () => Promise.resolve(),
    beginFailedPasswordChangeCompensation: () => Promise.resolve({
      authCompensationRequired: true,
      credentialVersion,
    }),
    completeFailedPasswordChangeCompensation: () => Promise.resolve(),
    temporaryPassword: () => temporaryPassword,
    ...overrides,
  }
}

function request(body: unknown): Request {
  return new Request('https://functions.example.invalid/student-account', {
    method: 'POST',
    headers: {
      authorization: 'Bearer valid-token',
      'content-type': 'application/json',
      origin,
    },
    body: JSON.stringify(body),
  })
}

Deno.test('student account origin and temporary password controls run in Deno', () => {
  const allowed = parseAllowedOrigins(
    'https://students.conceptinstitute.co.in,http://localhost:4173',
  )
  assert(allowed.has(origin), 'production origin should be present')
  let sequence = 0
  const password = generateTemporaryPassword(18, (maximum) => {
    const result = sequence % maximum
    sequence += 1
    return result
  })
  assert(/[A-Z]/.test(password), 'temporary password should have uppercase')
  assert(/[a-z]/.test(password), 'temporary password should have lowercase')
  assert(/[0-9]/.test(password), 'temporary password should have a digit')
  assert(/[!@#$%*+?=_-]/.test(password), 'temporary password should have a symbol')
})

Deno.test('student account provision reveals a credential once without its internal email', async () => {
  const response = await createStudentAccountHandler(dependencies())(
    request({ action: 'provision', studentId }),
  )
  const body = await response.json()
  assertEquals(response.status, 201, 'provision status')
  assertEquals(body, {
    action: 'provision',
    state: 'provisioned',
    studentId,
    loginId,
    temporaryPassword,
  }, 'provision response')
  assert(!JSON.stringify(body).includes(authEmail), 'internal email must not be returned')
})

Deno.test('student account reset gates the database before changing Auth', async () => {
  const order: string[] = []
  const deps = dependencies({
    beginCredentialReset: () => {
      order.push('database-gated')
      return Promise.resolve({
        studentId,
        userId: studentUserId,
        loginId,
        authEmail,
        mustChangePassword: true,
        credentialVersion,
        operationId,
      })
    },
    resetAuthPassword: () => {
      order.push('auth-reset')
      return Promise.resolve()
    },
  })
  const response = await createStudentAccountHandler(deps)(
    request({ action: 'reset', studentId }),
  )
  assertEquals(response.status, 200, 'reset status')
  assertEquals(order, ['database-gated', 'auth-reset'], 'fail-closed reset order')
})

Deno.test('initial password completion follows a successful Auth update', async () => {
  const order: string[] = []
  const deps = dependencies({
    updateOwnPassword: () => {
      order.push('auth-password-changed')
      return Promise.resolve()
    },
    completeInitialPasswordChange: () => {
      order.push('database-completed')
      return Promise.resolve()
    },
  })
  const response = await createStudentAccountHandler(deps)(
    request({
      action: 'change-initial-password',
      newPassword: 'A-Stronger-Pass9',
    }),
  )
  assertEquals(response.status, 200, 'password change status')
  assertEquals(
    order,
    ['auth-password-changed', 'database-completed'],
    'password completion order',
  )
})
