import { spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npmCommand, ['run', 'build'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    CONCEPT_SYNTHETIC_BUILD: '1',
    VITE_SUPABASE_URL: 'https://concept-portal-build.invalid',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic_build_only_never-deploy',
    VITE_SUPABASE_ANON_KEY: '',
  },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
