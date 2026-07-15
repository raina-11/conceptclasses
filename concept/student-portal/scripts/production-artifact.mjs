import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const SYNTHETIC_ORIGIN = 'https://concept-portal-build.invalid'
const HOSTED_SUPABASE_ORIGIN = /https:\/\/[a-z0-9]{20}\.supabase\.co/

export function validateProductionArtifact(headers, javascriptBundles) {
  if (headers.includes(SYNTHETIC_ORIGIN) || javascriptBundles.includes(SYNTHETIC_ORIGIN)) {
    throw new Error('Refusing to deploy the synthetic browser-test artifact.')
  }

  const cspLine = headers
    .split('\n')
    .find((line) => line.includes('Content-Security-Policy:'))
  const origin = cspLine?.match(HOSTED_SUPABASE_ORIGIN)?.[0]
  if (!origin) {
    throw new Error('Production _headers does not pin connect-src to a hosted Supabase origin.')
  }
  if (!javascriptBundles.includes(origin)) {
    throw new Error('The browser bundle and generated CSP do not use the same Supabase origin.')
  }
  return origin
}

export function verifyProductionDist(directory = resolve(process.cwd(), 'dist')) {
  const headers = readFileSync(resolve(directory, '_headers'), 'utf8')
  const assetsDirectory = resolve(directory, 'assets')
  const javascriptBundles = readdirSync(assetsDirectory)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => readFileSync(resolve(assetsDirectory, fileName), 'utf8'))
    .join('\n')
  return validateProductionArtifact(headers, javascriptBundles)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const origin = verifyProductionDist()
  console.log(`Verified production artifact for ${origin}.`)
}
