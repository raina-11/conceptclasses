import { describe, expect, it } from 'vitest'
import { verifyBackupSource } from './verify-backup-source.mjs'

const projectRef = 'abcdefghijklmnopqrst'

describe('backup source identity', () => {
  it('accepts only a loopback database when Storage is local', () => {
    expect(
      verifyBackupSource({
        storageMode: 'local',
        databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      }),
    ).toBe('local-loopback')

    expect(() =>
      verifyBackupSource({
        storageMode: 'local',
        databaseUrl: `postgresql://postgres:secret@db.${projectRef}.supabase.co/postgres`,
      }),
    ).toThrow(/loopback database/i)
  })

  it('accepts a linked project only when the explicit ref, CLI link, and direct DB host agree', () => {
    expect(
      verifyBackupSource({
        storageMode: 'linked',
        databaseUrl: `postgresql://postgres:secret@db.${projectRef}.supabase.co:5432/postgres`,
        projectRef,
        linkedProjectRef: projectRef,
      }),
    ).toBe(`supabase:${projectRef}`)
  })

  it('rejects a CLI link to a different Storage project', () => {
    expect(() =>
      verifyBackupSource({
        storageMode: 'linked',
        databaseUrl: `postgresql://postgres:secret@db.${projectRef}.supabase.co/postgres`,
        projectRef,
        linkedProjectRef: 'differentprojectref1',
      }),
    ).toThrow(/linked CLI project does not match/i)
  })

  it('rejects a database host that does not belong to the declared project', () => {
    expect(() =>
      verifyBackupSource({
        storageMode: 'linked',
        databaseUrl: 'postgresql://postgres:secret@db.zyxwvutsrqponmlkjihg.supabase.co/postgres',
        projectRef,
        linkedProjectRef: projectRef,
      }),
    ).toThrow(/database host does not match/i)
  })
})
