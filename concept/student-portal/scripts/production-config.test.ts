import { describe, expect, it } from 'vitest'
import {
  SYNTHETIC_BUILD_KEY,
  SYNTHETIC_BUILD_URL,
  createNetlifyHeaders,
  validateProductionConfig,
} from './production-config'

const hostedUrl = 'https://abcdefghijklmnopqrst.supabase.co'
const publishableKey = 'sb_publishable_e2e_only_not_a_real_project_key'

function legacyJwt(role: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase' })}.synthetic-signature`
}

describe('production portal configuration', () => {
  it('accepts one exact hosted HTTPS Supabase origin and a publishable key', () => {
    expect(validateProductionConfig({
      VITE_SUPABASE_URL: hostedUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    })).toEqual({ supabaseOrigin: hostedUrl })
  })

  it('allows only unmistakable reserved sentinels for the explicit synthetic build', () => {
    expect(validateProductionConfig({
      CONCEPT_SYNTHETIC_BUILD: '1',
      VITE_SUPABASE_URL: SYNTHETIC_BUILD_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: SYNTHETIC_BUILD_KEY,
    })).toEqual({ supabaseOrigin: SYNTHETIC_BUILD_URL })

    expect(() => validateProductionConfig({
      CONCEPT_SYNTHETIC_BUILD: '1',
      VITE_SUPABASE_URL: hostedUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    })).toThrow('repository test sentinels')
  })

  it.each([
    [{}, 'VITE_SUPABASE_URL'],
    [{ VITE_SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey }, 'HTTPS'],
    [{ VITE_SUPABASE_URL: `${hostedUrl}/rest/v1`, VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey }, 'origin'],
    [{ VITE_SUPABASE_URL: `${hostedUrl}:444`, VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey }, 'origin'],
    [{ VITE_SUPABASE_URL: 'https://example.com', VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey }, 'hosted Supabase'],
    [{ VITE_SUPABASE_URL: hostedUrl }, 'publishable'],
    [{ VITE_SUPABASE_URL: hostedUrl, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_do_not_bundle' }, 'secret'],
    [{ VITE_SUPABASE_URL: hostedUrl, VITE_SUPABASE_ANON_KEY: legacyJwt('service_role') }, 'service_role'],
    [{ VITE_SUPABASE_URL: hostedUrl, VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey, VITE_SUPABASE_ANON_KEY: legacyJwt('service_role') }, 'service_role'],
  ])('rejects unsafe or incomplete build environment %#', (environment, message) => {
    expect(() => validateProductionConfig(environment)).toThrow(message)
  })

  it('accepts a legacy anon JWT only in the explicitly supported fallback variable', () => {
    expect(validateProductionConfig({
      VITE_SUPABASE_URL: hostedUrl,
      VITE_SUPABASE_ANON_KEY: legacyJwt('anon'),
    })).toEqual({ supabaseOrigin: hostedUrl })
  })

  it('generates a strict CSP pinned to the configured origin', () => {
    const headers = createNetlifyHeaders(hostedUrl)

    expect(headers).toContain(`connect-src 'self' ${hostedUrl}`)
    expect(headers).not.toContain('*.supabase.co')
    expect(headers).not.toContain('wss:')
    expect(headers).not.toContain(publishableKey)
    expect(headers).toContain('Cache-Control: public, max-age=31536000, immutable')
  })
})
