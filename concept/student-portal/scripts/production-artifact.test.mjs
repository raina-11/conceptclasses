import { describe, expect, it } from 'vitest'
import { validateProductionArtifact } from './production-artifact.mjs'

const productionOrigin = 'https://abcdefghijklmnopqrst.supabase.co'
const headers = (origin) => `/*\n  Content-Security-Policy: default-src 'self'; connect-src 'self' ${origin}; script-src 'self'\n`

describe('production deployment artifact guard', () => {
  it('accepts a bundle and CSP that use the same hosted project origin', () => {
    expect(validateProductionArtifact(
      headers(productionOrigin),
      `const backend = "${productionOrigin}"`,
    )).toBe(productionOrigin)
  })

  it('rejects the synthetic browser-test artifact', () => {
    const syntheticOrigin = 'https://concept-portal-build.invalid'
    expect(() => validateProductionArtifact(
      headers(syntheticOrigin),
      `const backend = "${syntheticOrigin}"`,
    )).toThrow(/synthetic browser-test artifact/i)
  })

  it('rejects a mismatch between the bundle and generated CSP', () => {
    expect(() => validateProductionArtifact(
      headers(productionOrigin),
      'const backend = "https://different-project.supabase.co"',
    )).toThrow(/do not use the same Supabase origin/i)
  })
})
