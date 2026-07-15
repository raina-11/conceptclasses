export type TemporaryCredentialAction = 'created' | 'reset'

export type TemporaryCredentialExportRow = {
  studentName: string
  rollNumber: string
  batch: string
  loginId: string
  temporaryPassword: string
  action: TemporaryCredentialAction
  issuedAt: string
}

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const CREDENTIAL_COLUMNS = [
  { header: 'Student Name', key: 'studentName', width: 30 },
  { header: 'Roll Number', key: 'rollNumber', width: 18 },
  { header: 'Batch', key: 'batch', width: 18 },
  { header: 'Login ID', key: 'loginId', width: 22 },
  { header: 'Temporary Password', key: 'temporaryPassword', width: 28 },
  { header: 'Action', key: 'action', width: 14 },
  { header: 'Issued At', key: 'issuedAt', width: 26 },
] as const

const INSTRUCTIONS = [
  'This file contains sensitive one-time temporary credentials.',
  'Store it securely and distribute each credential directly to the correct student.',
  'Delete this file after use.',
  'Passwords cannot be recovered after the one-time credential response is cleared.',
  'Students must change their temporary password at first login.',
  'Student portal: https://students.conceptinstitute.co.in/',
] as const

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

export function temporaryCredentialFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  const hours = padDatePart(date.getHours())
  const minutes = padDatePart(date.getMinutes())
  const seconds = padDatePart(date.getSeconds())

  return `concept-student-temporary-credentials-${year}-${month}-${day}-${hours}${minutes}${seconds}.xlsx`
}

export async function buildTemporaryCredentialWorkbook(
  rows: readonly TemporaryCredentialExportRow[],
): Promise<Uint8Array<ArrayBuffer>> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Concept Institute Student Portal'
  workbook.company = 'Concept Institute'

  const instructions = workbook.addWorksheet('Instructions', {
    views: [{ showGridLines: false }],
  })
  instructions.getColumn(1).width = 92
  instructions.addRow(['Temporary credential file'])
  instructions.getCell('A1').font = {
    bold: true,
    color: { argb: 'FF7C2D1A' },
    size: 16,
  }
  instructions.getCell('A1').numFmt = '@'

  for (const instruction of INSTRUCTIONS) {
    const row = instructions.addRow([instruction])
    row.getCell(1).numFmt = '@'
    row.getCell(1).alignment = { vertical: 'top', wrapText: true }
  }

  const credentials = workbook.addWorksheet('Temporary Credentials', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  credentials.columns = CREDENTIAL_COLUMNS.map((column) => ({
    ...column,
    style: { numFmt: '@' },
  }))
  credentials.autoFilter = {
    from: 'A1',
    to: 'G1',
  }

  const header = credentials.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C2D1A' },
  }
  header.alignment = { vertical: 'middle' }
  header.height = 22

  for (const credential of rows) {
    const row = credentials.addRow({
      studentName: String(credential.studentName),
      rollNumber: String(credential.rollNumber),
      batch: String(credential.batch),
      loginId: String(credential.loginId),
      temporaryPassword: String(credential.temporaryPassword),
      action: String(credential.action),
      issuedAt: String(credential.issuedAt),
    })

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.numFmt = '@'
      cell.alignment = { vertical: 'top', wrapText: true }
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}

export async function downloadTemporaryCredentialWorkbook(
  rows: readonly TemporaryCredentialExportRow[],
  date = new Date(),
) {
  const bytes = await buildTemporaryCredentialWorkbook(rows)
  const filename = temporaryCredentialFilename(date)
  const blob = new Blob([bytes], { type: XLSX_MIME_TYPE })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)

  try {
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }

  return filename
}
