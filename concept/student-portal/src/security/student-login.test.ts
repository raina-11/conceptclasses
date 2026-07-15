import { describe, expect, it } from 'vitest'
import { authEmailForLoginId, normalizeLoginId } from './student-login'

describe('student login identifiers', () => {
  it('preserves leading zeroes while normalizing harmless case and spacing', () => {
    expect(normalizeLoginId('  0012  ')).toBe('0012')
    expect(normalizeLoginId('  9M-AB12  ')).toBe('9m-ab12')
  })

  it('maps a safe visible login ID to the internal Supabase email identity', () => {
    expect(authEmailForLoginId('0012')).toBe('student.0012@login.concept.invalid')
    expect(authEmailForLoginId('ADMIN')).toBe('student.admin@login.concept.invalid')
  })

  it('accepts collision-safe batch IDs up to the shared 64-character limit', () => {
    const loginId = `batch-${'a'.repeat(58)}`
    expect(normalizeLoginId(loginId)).toHaveLength(64)
    expect(authEmailForLoginId(loginId)).toBe(`student.${loginId}@login.concept.invalid`)
  })

  it('rejects email-shaped or control-character identifiers', () => {
    expect(() => authEmailForLoginId('student@example.com')).toThrow('valid roll number')
    expect(() => authEmailForLoginId('00\n12')).toThrow('valid roll number')
  })
})
