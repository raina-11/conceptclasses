const DEFAULT_ALLOWED_ORIGINS = [
  'https://students.conceptinstitute.co.in',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
]

export function parseAllowedOrigins(
  configured: string | undefined,
): ReadonlySet<string> {
  const values = configured ? configured.split(',') : DEFAULT_ALLOWED_ORIGINS
  const origins = new Set<string>()

  for (const candidate of values) {
    const value = candidate.trim()
    if (!value || value === '*') {
      throw new Error(
        'STUDENT_ACCOUNT_ALLOWED_ORIGINS must contain exact HTTP(S) origins.',
      )
    }

    const url = new URL(value)
    const isLoopback =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (
      (url.protocol !== 'https:' && !(isLoopback && url.protocol === 'http:')) ||
      url.origin !== value
    ) {
      throw new Error(
        `Invalid exact origin in STUDENT_ACCOUNT_ALLOWED_ORIGINS: ${value}`,
      )
    }
    origins.add(value)
  }

  if (origins.size === 0) {
    throw new Error(
      'STUDENT_ACCOUNT_ALLOWED_ORIGINS must contain at least one origin.',
    )
  }
  return origins
}
