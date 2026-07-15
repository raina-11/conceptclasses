import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

export function adminIdentity(value) {
  const loginId = String(value ?? '').normalize('NFKC').trim().toLowerCase()
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    throw new Error('CONCEPT_ADMIN_LOGIN_ID must be a valid 1–64 character login ID.')
  }
  return {
    loginId,
    authEmail: `student.${loginId}@login.concept.invalid`,
  }
}

export function validateAdminPassword(value) {
  const password = String(value ?? '')
  if (password.length < 14 || password.length > 128) {
    throw new Error('CONCEPT_ADMIN_PASSWORD must contain between 14 and 128 characters.')
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('CONCEPT_ADMIN_PASSWORD must include uppercase, lowercase, and numeric characters.')
  }
  if (!/[!@#$%*+?=_-]/.test(password) || /[\s'"`\\]/.test(password)) {
    throw new Error('CONCEPT_ADMIN_PASSWORD must include a safe symbol and contain no whitespace or quotes.')
  }
}

export function assertBootstrapTarget(apiUrl, databaseUrl, allowRemote) {
  const api = new URL(apiUrl)
  const database = new URL(databaseUrl)
  const isLocal = LOOPBACK_HOSTS.has(api.hostname) && LOOPBACK_HOSTS.has(database.hostname)
  if (!isLocal && !allowRemote) {
    throw new Error('Set ALLOW_REMOTE_ADMIN_BOOTSTRAP=1 only after verifying the production project and database URLs.')
  }
  if (api.protocol !== 'https:' && !(isLocal && api.protocol === 'http:')) {
    throw new Error('The Supabase API URL must use HTTPS outside local development.')
  }
  if (database.protocol !== 'postgres:' && database.protocol !== 'postgresql:') {
    throw new Error('SUPABASE_DB_URL must be a PostgreSQL URL.')
  }
}

function parseEnvironmentOutput(output) {
  const values = {}
  for (const line of output.split(/\r?\n/u)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line.trim())
    if (!match) continue
    const raw = match[2].trim()
    values[match[1]] =
      raw.length >= 2 &&
      ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'")))
        ? raw.slice(1, -1)
        : raw
  }
  return values
}

function localSupabaseStatus() {
  const result = spawnSync(
    'npx',
    ['--no-install', 'supabase', 'status', '-o', 'env'],
    { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
  )
  if (result.error || result.status !== 0) {
    throw new Error('Local Supabase configuration could not be discovered. Start Supabase or set its environment variables.')
  }
  return parseEnvironmentOutput(result.stdout)
}

export function selectBootstrapServiceKey(environment) {
  return (
    environment.SUPABASE_SECRET_KEY?.trim() ||
    environment.SUPABASE_SERVICE_ROLE_KEY?.trim()
  )
}

function configuration() {
  const configured = {
    apiUrl: process.env.SUPABASE_URL?.trim(),
    serviceKey: selectBootstrapServiceKey(process.env),
    databaseUrl:
      process.env.SUPABASE_DB_URL?.trim() ?? process.env.DB_URL?.trim(),
  }
  const discovered = configured.apiUrl && configured.serviceKey && configured.databaseUrl
    ? {}
    : localSupabaseStatus()
  const result = {
    apiUrl: configured.apiUrl ?? discovered.API_URL,
    serviceKey:
      configured.serviceKey ?? discovered.SECRET_KEY ?? discovered.SERVICE_ROLE_KEY,
    databaseUrl: configured.databaseUrl ?? discovered.DB_URL,
  }
  if (!result.apiUrl || !result.serviceKey || !result.databaseUrl) {
    throw new Error('SUPABASE_URL, a service-role/secret key, and SUPABASE_DB_URL are required.')
  }
  assertBootstrapTarget(
    result.apiUrl,
    result.databaseUrl,
    process.env.ALLOW_REMOTE_ADMIN_BOOTSTRAP === '1',
  )
  return result
}

function decoded(value, label) {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new Error(`${label} contains invalid URL encoding.`)
  }
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function applyAdminDatabaseState(databaseUrl, userId, loginId) {
  const parsed = new URL(databaseUrl)
  const databaseName = decoded(parsed.pathname.replace(/^\/+/, ''), 'Database name')
  const sql = `
    do $bootstrap_admin$
    begin
      update app_private.user_accounts
      set login_id = ${sqlLiteral(loginId)},
          status = 'active',
          status_reason = null,
          status_changed_by = ${sqlLiteral(userId)}::uuid,
          status_changed_at = statement_timestamp(),
          must_change_password = true,
          temporary_password_issued_at = statement_timestamp(),
          password_changed_at = null,
          credential_changed_by = ${sqlLiteral(userId)}::uuid,
          credential_changed_at = statement_timestamp(),
          credential_version = extensions.gen_random_uuid(),
          password_change_operation_id = null,
          password_change_operation_state = null,
          password_change_operation_started_at = null,
          password_change_operation_completed_at = null,
          password_change_operation_credential_version = null
      where user_id = ${sqlLiteral(userId)}::uuid;

      if not found then
        raise exception 'Auth hook did not create the portal account';
      end if;

      insert into app_private.account_roles (user_id, role, granted_by)
      values (${sqlLiteral(userId)}::uuid, 'admin', ${sqlLiteral(userId)}::uuid)
      on conflict (user_id, role) do nothing;

      perform app_private.write_audit_event(
        ${sqlLiteral(userId)}::uuid,
        'credential.admin_bootstrapped',
        'user_account',
        ${sqlLiteral(userId)}::uuid,
        jsonb_build_object('login_id', ${sqlLiteral(loginId)})
      );
    end
    $bootstrap_admin$;
  `
  const run = spawnSync(
    process.env.PSQL_BIN?.trim() || 'psql',
    ['-X', '-q', '-v', 'ON_ERROR_STOP=1'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      input: sql,
      env: {
        ...process.env,
        PGHOST: parsed.hostname.replace(/^\[|\]$/gu, ''),
        PGPORT: parsed.port || '5432',
        PGUSER: decoded(parsed.username, 'Database username'),
        PGPASSWORD: decoded(parsed.password, 'Database password'),
        PGDATABASE: databaseName,
        PGCONNECT_TIMEOUT: '8',
        PGSSLMODE: LOOPBACK_HOSTS.has(parsed.hostname) ? 'disable' : 'require',
      },
      maxBuffer: 1024 * 1024,
    },
  )
  if (run.error || run.status !== 0) {
    throw new Error('The Auth user was created, but its admin database role could not be applied. Rerun the command after checking the database connection.')
  }
}

async function findAuthUserByEmail(client, authEmail) {
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Existing Auth users could not be checked with the service credential.')
    const match = data.users.find((user) => user.email?.toLowerCase() === authEmail)
    if (match) return match
    if (data.users.length < 1000) return null
  }
  throw new Error('The Auth user directory is too large for the bootstrap safety limit.')
}

export async function bootstrapAdmin() {
  const { loginId, authEmail } = adminIdentity(
    process.env.CONCEPT_ADMIN_LOGIN_ID || 'admin',
  )
  const password = process.env.CONCEPT_ADMIN_PASSWORD
  validateAdminPassword(password)
  const { apiUrl, serviceKey, databaseUrl } = configuration()
  const client = createClient(apiUrl, serviceKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  })

  const existing = await findAuthUserByEmail(client, authEmail)
  let userId
  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, login_id: loginId },
    })
    if (error || !data.user) throw new Error('The existing admin Auth identity could not be updated.')
    userId = data.user.id
  } else {
    const { data, error } = await client.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { login_id: loginId },
    })
    if (error || !data.user) throw new Error('The admin Auth identity could not be created.')
    userId = data.user.id
  }

  applyAdminDatabaseState(databaseUrl, userId, loginId)
  return { loginId, created: !existing, apiUrl }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
if (isMain) {
  bootstrapAdmin()
    .then(({ loginId, created, apiUrl }) => {
      process.stdout.write(
        `${created ? 'Created' : 'Updated'} admin login "${loginId}" for ${new URL(apiUrl).origin}. The temporary password was not printed; first sign-in must replace it.\n`,
      )
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : 'Admin bootstrap failed.'}\n`)
      process.exitCode = 1
    })
}
