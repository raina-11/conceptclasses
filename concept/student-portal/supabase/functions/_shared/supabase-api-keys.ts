export type EnvironmentReader = {
  get(name: string): string | undefined
}

type SupabaseApiKeys = {
  publishableKey: string
  secretKey: string
}

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

function hostedNamedKey(
  environment: EnvironmentReader,
  name: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS',
  preferredKeyNames: readonly string[],
): string | null {
  const encodedKeys = environment.get(name)?.trim()
  if (!encodedKeys) return null

  let parsedKeys: unknown
  try {
    parsedKeys = JSON.parse(encodedKeys)
  } catch {
    throw new Error(`Invalid JSON in ${name}`)
  }

  if (
    typeof parsedKeys !== 'object' ||
    parsedKeys === null ||
    Array.isArray(parsedKeys)
  ) {
    throw new Error(
      `Missing non-empty ${preferredKeyNames.map((key) => `"${key}"`).join(' or ')} key in ${name}`,
    )
  }

  for (const keyName of preferredKeyNames) {
    const key = (parsedKeys as Record<string, unknown>)[keyName]
    if (typeof key === 'string' && key.trim()) return key.trim()
  }
  throw new Error(
    `Missing non-empty ${preferredKeyNames.map((key) => `"${key}"`).join(' or ')} key in ${name}`,
  )
}

export function resolveSupabaseApiKeys(
  environment: EnvironmentReader,
): SupabaseApiKeys {
  return {
    publishableKey:
      hostedNamedKey(environment, 'SUPABASE_PUBLISHABLE_KEYS', ['default']) ??
      requiredEnvironment(
        environment,
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
      ),
    secretKey:
      hostedNamedKey(
        environment,
        'SUPABASE_SECRET_KEYS',
        ['portal_backend', 'default'],
      ) ??
      requiredEnvironment(
        environment,
        'SUPABASE_SECRET_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ),
  }
}
