import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])
const PROJECT_REF_PATTERN = /^[a-z0-9][a-z0-9-]{5,62}[a-z0-9]$/

function databaseHost(databaseUrl) {
  let parsed
  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new Error('SUPABASE_DB_URL must be a valid PostgreSQL URL.')
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('SUPABASE_DB_URL must use the PostgreSQL protocol.')
  }
  return parsed.hostname.toLowerCase()
}

export function verifyBackupSource({
  storageMode,
  databaseUrl,
  projectRef,
  linkedProjectRef,
}) {
  const host = databaseHost(databaseUrl)
  if (storageMode === 'local') {
    if (!LOOPBACK_HOSTS.has(host)) {
      throw new Error('Local Storage backup requires a loopback database URL.')
    }
    return 'local-loopback'
  }

  if (storageMode !== 'linked') {
    throw new Error('SUPABASE_STORAGE_MODE must be either linked or local.')
  }
  if (!projectRef || !PROJECT_REF_PATTERN.test(projectRef)) {
    throw new Error('SUPABASE_PROJECT_REF is required for a linked backup.')
  }
  if (linkedProjectRef?.trim() !== projectRef) {
    throw new Error('The linked CLI project does not match SUPABASE_PROJECT_REF.')
  }
  if (host !== `db.${projectRef}.supabase.co`) {
    throw new Error('The database host does not match SUPABASE_PROJECT_REF.')
  }
  return `supabase:${projectRef}`
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (invokedPath === import.meta.url) {
  try {
    const storageMode = process.env.SUPABASE_STORAGE_MODE ?? 'linked'
    const linkedProjectRef =
      storageMode === 'linked'
        ? readFileSync(
            process.env.SUPABASE_LINKED_PROJECT_REF_FILE ??
              fileURLToPath(new URL('../supabase/.temp/project-ref', import.meta.url)),
            'utf8',
          ).trim()
        : undefined
    const identity = verifyBackupSource({
      storageMode,
      databaseUrl: process.env.SUPABASE_DB_URL ?? '',
      projectRef: process.env.SUPABASE_PROJECT_REF,
      linkedProjectRef,
    })
    process.stdout.write(identity)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup source verification failed.'
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  }
}
