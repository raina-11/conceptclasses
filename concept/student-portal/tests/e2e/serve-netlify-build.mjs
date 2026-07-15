import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'

const projectRoot = process.cwd()
const distRoot = resolve(projectRoot, 'dist')
const config = readFileSync(resolve(projectRoot, 'netlify.toml'), 'utf8')
const generatedHeaders = readFileSync(resolve(distRoot, '_headers'), 'utf8')
const port = Number(process.env.E2E_BUILD_PORT ?? 4173)

const spaRewrite = /\[\[redirects\]\][\s\S]*?from\s*=\s*"\/\*"[\s\S]*?to\s*=\s*"\/index\.html"[\s\S]*?status\s*=\s*200/.test(config)
if (!spaRewrite) {
  throw new Error('netlify.toml must contain a /* -> /index.html status 200 SPA rewrite')
}

function parseHeaderRules(source) {
  const rules = []
  let currentRule = null
  for (const line of source.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      currentRule = { pathPattern: line.trim(), values: {} }
      rules.push(currentRule)
      continue
    }
    const header = line.match(/^\s+([A-Za-z0-9-]+):\s*(.*)$/)
    if (currentRule && header) currentRule.values[header[1]] = header[2]
  }
  return rules
}

const headerRules = parseHeaderRules(generatedHeaders)
if (!headerRules.some((rule) => rule.pathPattern === '/*' && rule.values['Content-Security-Policy'])) {
  throw new Error('dist/_headers must define a site-wide Content-Security-Policy')
}

function pathMatches(pathPattern, requestPath) {
  if (pathPattern === '/*') return true
  if (pathPattern.endsWith('*')) return requestPath.startsWith(pathPattern.slice(0, -1))
  return requestPath === pathPattern
}

function configuredHeaders(requestPath) {
  return Object.assign(
    {},
    ...headerRules
      .filter((rule) => pathMatches(rule.pathPattern, requestPath))
      .map((rule) => rule.values),
  )
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function existingFile(requestPath) {
  const relativePath = requestPath.replace(/^\/+/, '')
  const candidate = resolve(distRoot, relativePath || 'index.html')
  if (candidate !== distRoot && !candidate.startsWith(`${distRoot}${sep}`)) return null
  try {
    if (statSync(candidate).isFile()) return candidate
  } catch {
    return resolve(distRoot, 'index.html')
  }
  return resolve(distRoot, 'index.html')
}

const server = createServer((request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    const filePath = existingFile(requestPath)
    if (!filePath) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Invalid path')
      return
    }

    const body = readFileSync(filePath)
    response.writeHead(200, {
      ...configuredHeaders(requestPath),
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Build server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Netlify-compatible build server listening on http://127.0.0.1:${port}\n`)
})
