// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

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
})
