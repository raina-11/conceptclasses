const INTERNAL_LOGIN_EMAIL_DOMAIN = 'login.concept.invalid'
const INTERNAL_LOGIN_EMAIL_PREFIX = 'student.'
const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/

export function normalizeLoginId(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase()
}

export function authEmailForLoginId(value: string): string {
  const loginId = normalizeLoginId(value)
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    throw new Error('Enter a valid roll number or admin ID.')
  }
  return `${INTERNAL_LOGIN_EMAIL_PREFIX}${loginId}@${INTERNAL_LOGIN_EMAIL_DOMAIN}`
}

export function visibleLoginId(
  email: string | undefined,
  metadataLoginId: unknown,
): string {
  if (typeof metadataLoginId === 'string') {
    const loginId = normalizeLoginId(metadataLoginId)
    if (LOGIN_ID_PATTERN.test(loginId)) return loginId
  }

  const normalizedEmail = email?.trim().toLowerCase() ?? ''
  const suffix = `@${INTERNAL_LOGIN_EMAIL_DOMAIN}`
  if (normalizedEmail.startsWith(INTERNAL_LOGIN_EMAIL_PREFIX) && normalizedEmail.endsWith(suffix)) {
    const loginId = normalizedEmail.slice(INTERNAL_LOGIN_EMAIL_PREFIX.length, -suffix.length)
    if (LOGIN_ID_PATTERN.test(loginId)) return loginId
  }

  return email?.trim() || 'Signed-in account'
}
