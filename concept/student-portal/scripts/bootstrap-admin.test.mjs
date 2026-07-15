import { describe, expect, it } from 'vitest'
import {
  adminIdentity,
  assertBootstrapTarget,
  selectBootstrapServiceKey,
  validateAdminPassword,
} from './bootstrap-admin.mjs'

describe('admin bootstrap safety', () => {
  it('uses the same canonical login identity as the browser', () => {
    expect(adminIdentity('  ADMIN  ')).toEqual({
      loginId: 'admin',
      authEmail: 'student.admin@login.concept.invalid',
    })
    expect(adminIdentity('office_1')).toEqual({
      loginId: 'office_1',
      authEmail: 'student.office_1@login.concept.invalid',
    })
  })

  it('rejects identifiers that cannot be stored by the database contract', () => {
    expect(() => adminIdentity('admin@example.com')).toThrow('login ID')
    expect(() => adminIdentity(`a${'b'.repeat(64)}`)).toThrow('login ID')
    expect(() => adminIdentity('admin\nroot')).toThrow('login ID')
  })

  it('requires a strong temporary admin password without returning it', () => {
    expect(validateAdminPassword('AdminTemporary9!Pass')).toBeUndefined()
    expect(() => validateAdminPassword('short')).toThrow('between 14')
    expect(() => validateAdminPassword('alllowercasebutlong9!')).toThrow('uppercase')
  })

  it('allows automatic local setup but requires an explicit remote-production guard', () => {
    expect(() =>
      assertBootstrapTarget('http://127.0.0.1:54321', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres', false),
    ).not.toThrow()
    expect(() =>
      assertBootstrapTarget('https://project.supabase.co', 'postgresql://postgres:secret@db.example.com:5432/postgres', false),
    ).toThrow('ALLOW_REMOTE_ADMIN_BOOTSTRAP')
    expect(() =>
      assertBootstrapTarget('https://project.supabase.co', 'postgresql://postgres:secret@db.example.com:5432/postgres', true),
    ).not.toThrow()
  })

  it('prefers the new secret key and preserves the legacy service-role fallback', () => {
    expect(selectBootstrapServiceKey({
      SUPABASE_SECRET_KEY: 'new-secret',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
    })).toBe('new-secret')
    expect(selectBootstrapServiceKey({
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role',
    })).toBe('legacy-service-role')
  })
})
