// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

function functionConfiguration(source: string, functionName: string): string {
  const header = `[functions.${functionName}]`
  const start = source.indexOf(header)
  if (start === -1) return ''
  const nextSection = source.indexOf('\n[', start + header.length)
  return source.slice(start, nextSection === -1 ? undefined : nextSection)
}

describe('parse-result-xlsx Edge runtime dependencies', () => {
  it('uses the pinned bare ExcelJS reader instead of the CPU-heavy Node entry', async () => {
    const configurationUrl = new URL(
      '../../supabase/functions/parse-result-xlsx/deno.json',
      import.meta.url,
    )
    const configuration = JSON.parse(
      await readFile(configurationUrl, 'utf8'),
    ) as { imports?: Record<string, string> }

    expect(configuration.imports?.exceljs).toBe(
      'npm:exceljs@4.4.0/lib/exceljs.bare.js',
    )
  })

  it('leaves gateway JWT verification off because each handler validates the user token', async () => {
    const configurationUrl = new URL('../../supabase/config.toml', import.meta.url)
    const configuration = await readFile(configurationUrl, 'utf8')

    expect(functionConfiguration(configuration, 'parse-result-xlsx')).toContain(
      'verify_jwt = false',
    )
    expect(functionConfiguration(configuration, 'student-account')).toContain(
      'verify_jwt = false',
    )
  })
})
