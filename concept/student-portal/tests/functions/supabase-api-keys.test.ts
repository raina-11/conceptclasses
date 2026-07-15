import { describe, expect, it } from 'vitest'
import {
  resolveSupabaseApiKeys,
  type EnvironmentReader,
} from '../../supabase/functions/_shared/supabase-api-keys.ts'

function environment(values: Record<string, string>): EnvironmentReader {
  return {
    get(name) {
      return values[name]
    },
  }
}

describe('Supabase Edge Function API key environment', () => {
  it('prefers the hosted publishable default and portal backend secret', () => {
    const keys = resolveSupabaseApiKeys(environment({
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({
        default: 'hosted-publishable',
      }),
      SUPABASE_SECRET_KEYS: JSON.stringify({
        default: 'hosted-default-secret',
        portal_backend: 'hosted-portal-secret',
      }),
      SUPABASE_PUBLISHABLE_KEY: 'local-publishable',
      SUPABASE_SECRET_KEY: 'local-secret',
      SUPABASE_ANON_KEY: 'legacy-anon',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
    }))

    expect(keys).toEqual({
      publishableKey: 'hosted-publishable',
      secretKey: 'hosted-portal-secret',
    })
  })

  it('uses the hosted default secret when portal_backend is absent', () => {
    expect(resolveSupabaseApiKeys(environment({
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({
        default: 'hosted-publishable',
      }),
      SUPABASE_SECRET_KEYS: JSON.stringify({
        default: 'hosted-default-secret',
      }),
    }))).toEqual({
      publishableKey: 'hosted-publishable',
      secretKey: 'hosted-default-secret',
    })
  })

  it.each([
    [
      'SUPABASE_PUBLISHABLE_KEYS',
      'SUPABASE_SECRET_KEYS',
      'Missing non-empty "default" key in SUPABASE_PUBLISHABLE_KEYS',
    ],
    [
      'SUPABASE_SECRET_KEYS',
      'SUPABASE_PUBLISHABLE_KEYS',
      'Missing non-empty "portal_backend" or "default" key in SUPABASE_SECRET_KEYS',
    ],
  ] as const)(
    'rejects %s when its JSON object has no supported named key',
    (invalidName, validName, expectedMessage) => {
      expect(() => resolveSupabaseApiKeys(environment({
        [invalidName]: JSON.stringify({ secondary: 'named-key' }),
        [validName]: JSON.stringify({ default: 'valid-default' }),
        SUPABASE_ANON_KEY: 'legacy-anon',
        SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
      }))).toThrow(expectedMessage)
    },
  )

  it.each([
    ['SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_SECRET_KEYS'],
    ['SUPABASE_SECRET_KEYS', 'SUPABASE_PUBLISHABLE_KEYS'],
  ] as const)(
    'rejects malformed JSON in %s instead of silently using a fallback',
    (invalidName, validName) => {
      expect(() => resolveSupabaseApiKeys(environment({
        [invalidName]: '{not-json',
        [validName]: JSON.stringify({ default: 'valid-default' }),
        SUPABASE_ANON_KEY: 'legacy-anon',
        SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
      }))).toThrow(`Invalid JSON in ${invalidName}`)
    },
  )

  it('uses the local single-key environment when hosted key maps are absent', () => {
    expect(resolveSupabaseApiKeys(environment({
      SUPABASE_PUBLISHABLE_KEY: 'local-publishable',
      SUPABASE_SECRET_KEY: 'local-secret',
    }))).toEqual({
      publishableKey: 'local-publishable',
      secretKey: 'local-secret',
    })
  })

  it('preserves the legacy local CLI key fallback', () => {
    expect(resolveSupabaseApiKeys(environment({
      SUPABASE_ANON_KEY: 'legacy-anon',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
    }))).toEqual({
      publishableKey: 'legacy-anon',
      secretKey: 'legacy-service-role',
    })
  })
})
