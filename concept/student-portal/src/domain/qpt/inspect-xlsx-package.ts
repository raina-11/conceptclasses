import JSZip from 'jszip'

export type XlsxPackageIssue = {
  code: string
  message: string
}

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50
const MAX_ENTRIES = 1_000
const MAX_UNCOMPRESSED_ENTRY_BYTES = 20 * 1024 * 1024
const MAX_UNCOMPRESSED_TOTAL_BYTES = 50 * 1024 * 1024
const MAX_COMPRESSION_RATIO = 250

const DISALLOWED_ENTRY_PATTERNS = [
  /(^|\/)vbaProject\.bin$/i,
  /(^|\/)macrosheets\//i,
  /(^|\/)externalLinks\//i,
  /(^|\/)embeddings\//i,
  /(^|\/)oleObjects\//i,
  /(^|\/)activeX\//i,
  /(^|\/)comments\d*\.xml$/i,
  /(^|\/)threadedComments\//i,
  /^customXml\//i,
]

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const earliest = Math.max(0, bytes.byteLength - 65_557)
  for (let offset = bytes.byteLength - 22; offset >= earliest; offset -= 1) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) {
      return offset
    }
  }
  return -1
}

function safeEntryName(name: string): boolean {
  if (name.includes('\0') || name.includes('\\') || name.startsWith('/')) {
    return false
  }
  const segments = name.split('/')
  return !segments.some((segment) => segment === '..' || segment === '.')
}

function inspectCentralDirectory(bytes: Uint8Array): XlsxPackageIssue[] {
  const issues: XlsxPackageIssue[] = []
  if (bytes.byteLength < 22) {
    return [{ code: 'invalid_zip', message: 'The XLSX ZIP package is incomplete.' }]
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const endOffset = findEndOfCentralDirectory(bytes)
  if (endOffset < 0) {
    return [
      { code: 'invalid_zip', message: 'The XLSX ZIP directory is missing.' },
    ]
  }

  const diskNumber = view.getUint16(endOffset + 4, true)
  const directoryDisk = view.getUint16(endOffset + 6, true)
  const entriesOnDisk = view.getUint16(endOffset + 8, true)
  const entryCount = view.getUint16(endOffset + 10, true)
  const directorySize = view.getUint32(endOffset + 12, true)
  const directoryOffset = view.getUint32(endOffset + 16, true)

  if (diskNumber !== 0 || directoryDisk !== 0 || entriesOnDisk !== entryCount) {
    issues.push({
      code: 'multi_disk_zip_not_allowed',
      message: 'Multi-disk ZIP packages are not allowed.',
    })
    return issues
  }
  if (
    entryCount === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff
  ) {
    issues.push({
      code: 'zip64_not_allowed',
      message: 'ZIP64 XLSX packages are not allowed.',
    })
    return issues
  }
  if (entryCount === 0 || entryCount > MAX_ENTRIES) {
    issues.push({
      code: 'invalid_zip_entry_count',
      message: `The XLSX package must contain between 1 and ${MAX_ENTRIES} entries.`,
    })
    return issues
  }
  if (directoryOffset + directorySize > endOffset) {
    issues.push({
      code: 'invalid_zip_directory',
      message: 'The XLSX ZIP directory points outside the uploaded file.',
    })
    return issues
  }

  const decoder = new TextDecoder('utf-8', { fatal: true })
  let offset = directoryOffset
  let totalUncompressed = 0
  let contentTypesFound = false

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== CENTRAL_DIRECTORY_ENTRY) {
      issues.push({
        code: 'invalid_zip_directory',
        message: 'The XLSX ZIP directory contains an invalid entry.',
      })
      return issues
    }

    const flags = view.getUint16(offset + 8, true)
    const compression = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    const filenameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const nextOffset = offset + 46 + filenameLength + extraLength + commentLength
    if (nextOffset > bytes.byteLength) {
      issues.push({
        code: 'invalid_zip_directory',
        message: 'The XLSX ZIP entry is truncated.',
      })
      return issues
    }

    let name = ''
    try {
      name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + filenameLength))
    } catch {
      issues.push({
        code: 'invalid_zip_filename',
        message: 'The XLSX package contains an invalid filename.',
      })
    }

    if ((flags & 0x1) !== 0) {
      issues.push({
        code: 'encrypted_zip_not_allowed',
        message: 'Encrypted XLSX packages are not allowed.',
      })
    }
    if (compression !== 0 && compression !== 8) {
      issues.push({
        code: 'unsupported_zip_compression',
        message: 'The XLSX package uses unsupported compression.',
      })
    }
    if (!safeEntryName(name)) {
      issues.push({
        code: 'unsafe_zip_path',
        message: 'The XLSX package contains an unsafe path.',
      })
    }
    if (DISALLOWED_ENTRY_PATTERNS.some((pattern) => pattern.test(name))) {
      issues.push({
        code: 'disallowed_xlsx_part',
        message: 'The workbook contains an unsupported active or external part.',
      })
    }
    if (name === '[Content_Types].xml') contentTypesFound = true
    if (uncompressedSize > MAX_UNCOMPRESSED_ENTRY_BYTES) {
      issues.push({
        code: 'xlsx_entry_too_large',
        message: 'An XLSX package entry exceeds the safe size limit.',
      })
    }
    if (
      compressedSize === 0
        ? uncompressedSize > 0
        : uncompressedSize / compressedSize > MAX_COMPRESSION_RATIO
    ) {
      issues.push({
        code: 'suspicious_compression_ratio',
        message: 'The XLSX package has a suspicious compression ratio.',
      })
    }
    totalUncompressed += uncompressedSize
    offset = nextOffset
  }

  if (totalUncompressed > MAX_UNCOMPRESSED_TOTAL_BYTES) {
    issues.push({
      code: 'xlsx_uncompressed_too_large',
      message: 'The uncompressed XLSX package exceeds the safe size limit.',
    })
  }
  if (!contentTypesFound) {
    issues.push({
      code: 'not_an_xlsx_package',
      message: 'The ZIP file is not an XLSX package.',
    })
  }
  return issues
}

export async function inspectXlsxPackage(
  bytes: Uint8Array,
): Promise<XlsxPackageIssue[]> {
  const centralIssues = inspectCentralDirectory(bytes)
  if (centralIssues.length > 0) return centralIssues

  try {
    const archive = await JSZip.loadAsync(bytes, {
      createFolders: false,
      checkCRC32: false,
    })
    for (const [name, entry] of Object.entries(archive.files)) {
      if (!name.endsWith('.rels') || entry.dir) continue
      const relationshipXml = await entry.async('string')
      if (/TargetMode\s*=\s*["']External["']/i.test(relationshipXml)) {
        return [
          {
            code: 'external_relationship_not_allowed',
            message: 'External workbook relationships are not allowed.',
          },
        ]
      }
    }
  } catch {
    return [
      {
        code: 'invalid_zip',
        message: 'The XLSX ZIP package could not be read safely.',
      },
    ]
  }

  return []
}
