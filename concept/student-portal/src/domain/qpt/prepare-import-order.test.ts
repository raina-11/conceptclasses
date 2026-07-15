import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  inspectXlsxPackage: vi.fn(),
  loadAsync: vi.fn(),
}))

vi.mock('./inspect-xlsx-package.ts', () => ({
  inspectXlsxPackage: mocks.inspectXlsxPackage,
}))

vi.mock('jszip', () => ({
  default: { loadAsync: mocks.loadAsync },
}))

import { prepareQptImport } from './prepare-import.ts'

describe('prepareQptImport package ordering', () => {
  beforeEach(() => {
    mocks.inspectXlsxPackage.mockReset()
    mocks.loadAsync.mockReset()
  })

  it('rejects an unsafe package before layout XML is decompressed', async () => {
    mocks.inspectXlsxPackage.mockResolvedValue([
      {
        code: 'xlsx_entry_too_large',
        message: 'An XLSX package entry exceeds the safe size limit.',
      },
    ])
    mocks.loadAsync.mockRejectedValue(new Error('layout decoder must not run'))

    await expect(
      prepareQptImport(new Uint8Array([1, 2, 3]), {
        sourceFilename: 'unsafe.xlsx',
      }),
    ).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: 'xlsx_entry_too_large' })],
    })
    expect(mocks.inspectXlsxPackage).toHaveBeenCalledOnce()
    expect(mocks.loadAsync).not.toHaveBeenCalled()
  })
})
