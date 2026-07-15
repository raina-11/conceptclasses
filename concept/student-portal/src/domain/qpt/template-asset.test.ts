import { readFile } from 'node:fs/promises'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { parseQptWorkbook, WorkbookValidationError } from './parse-workbook'

const templatePath = 'public/templates/qpt-import-template.xlsx'

describe('downloadable QPT template', () => {
  it('contains only the three approved worksheets and no student-data fields', async () => {
    const bytes = await readFile(templatePath)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Uint8Array.from(bytes).buffer)

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Instructions',
      'Assessment',
      'Scores',
    ])

    const archive = await JSZip.loadAsync(bytes)
    const xmlParts = await Promise.all(
      Object.values(archive.files)
        .filter((entry) => !entry.dir && entry.name.endsWith('.xml'))
        .map((entry) => entry.async('string')),
    )
    const containsForbiddenStudentField =
      /student phone|father phone|mother phone/i.test(xmlParts.join('\n'))
    expect(containsForbiddenStudentField).toBe(false)
  })

  it('is structurally valid but remains unimportable until staff fills required data', async () => {
    const bytes = await readFile(templatePath)

    try {
      await parseQptWorkbook(bytes)
      throw new Error('blank template unexpectedly parsed')
    } catch (error) {
      expect(error).toBeInstanceOf(WorkbookValidationError)
      const codes = (error as WorkbookValidationError).issues.map(
        (entry) => entry.code,
      )
      expect(codes).toContain('missing_assessment_field')
      expect(codes).toContain('no_score_rows')
      expect(codes).not.toContain('unexpected_sheet')
      expect(codes).not.toContain('formula_not_allowed')
      expect(codes).not.toContain('hidden_row')
      expect(codes).not.toContain('hidden_column')
    }
  })
})
