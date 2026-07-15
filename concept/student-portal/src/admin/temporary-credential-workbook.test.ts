import ExcelJS from 'exceljs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildTemporaryCredentialWorkbook,
  downloadTemporaryCredentialWorkbook,
  temporaryCredentialFilename,
  type TemporaryCredentialExportRow,
} from './temporary-credential-workbook'

const credentials: TemporaryCredentialExportRow[] = [
  {
    studentName: 'Synthetic Student A',
    rollNumber: '00110',
    batch: '09-M',
    loginId: '00110',
    temporaryPassword: '=HYPERLINK("https://example.invalid","Open")',
    action: 'created',
    issuedAt: '2026-07-15T10:35:00.000Z',
  },
  {
    studentName: '+Formula-like name',
    rollNumber: '00007',
    batch: '@Batch',
    loginId: '-00007',
    temporaryPassword: '+SUM(1,1)',
    action: 'reset',
    issuedAt: '2026-07-15T10:36:00.000Z',
  },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('temporary credential workbook', () => {
  it('writes identifiers and formula-like values as exact text cells', async () => {
    const bytes = await buildTemporaryCredentialWorkbook(credentials)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes.buffer)

    const sheet = workbook.getWorksheet('Temporary Credentials')
    expect(sheet).toBeDefined()
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      'Student Name',
      'Roll Number',
      'Batch',
      'Login ID',
      'Temporary Password',
      'Action',
      'Issued At',
    ])

    expect(sheet?.getCell('B2').value).toBe('00110')
    expect(sheet?.getCell('D2').value).toBe('00110')
    expect(sheet?.getCell('E2').value).toBe(
      '=HYPERLINK("https://example.invalid","Open")',
    )
    expect(sheet?.getCell('A3').value).toBe('+Formula-like name')
    expect(sheet?.getCell('B3').value).toBe('00007')
    expect(sheet?.getCell('C3').value).toBe('@Batch')
    expect(sheet?.getCell('D3').value).toBe('-00007')
    expect(sheet?.getCell('E3').value).toBe('+SUM(1,1)')

    for (const address of ['B2', 'D2', 'E2', 'A3', 'B3', 'C3', 'D3', 'E3']) {
      expect(sheet?.getCell(address).type).toBe(ExcelJS.ValueType.String)
      expect(sheet?.getCell(address).numFmt).toBe('@')
    }

    expect(sheet?.views).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'frozen', ySplit: 1 })]),
    )
    expect(sheet?.autoFilter).toBe('A1:G1')
  })

  it('includes handling instructions for the sensitive one-time file', async () => {
    const bytes = await buildTemporaryCredentialWorkbook(credentials)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes.buffer)

    const sheet = workbook.getWorksheet('Instructions')
    const instructionText = sheet
      ?.getColumn(1)
      .values.map((value) => String(value))
      .join(' ')

    expect(instructionText).toContain('sensitive one-time temporary credentials')
    expect(instructionText).toContain('distribute each credential directly')
    expect(instructionText).toContain('Delete this file after use')
    expect(instructionText).toContain('Passwords cannot be recovered')
    expect(instructionText).toContain('must change their temporary password at first login')
    expect(instructionText).toContain('https://students.conceptinstitute.co.in/')
  })

  it('uses a deterministic xlsx filename and cleans up the browser download URL', async () => {
    const createObjectURL = vi.fn(() => 'blob:temporary-credentials')
    const revokeObjectURL = vi.fn()
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const date = new Date(2026, 6, 5, 12, 3, 4)

    expect(temporaryCredentialFilename(date)).toBe(
      'concept-student-temporary-credentials-2026-07-05-120304.xlsx',
    )
    await expect(downloadTemporaryCredentialWorkbook(credentials, date)).resolves.toBe(
      'concept-student-temporary-credentials-2026-07-05-120304.xlsx',
    )

    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: XLSX_MIME_TYPE_FOR_TEST }),
    )
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).not.toHaveBeenCalled()
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:temporary-credentials')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})

const XLSX_MIME_TYPE_FOR_TEST =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
