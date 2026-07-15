import { describe, expect, it } from 'vitest'
import {
  MAX_WORKBOOK_BATCH_SIZE,
  MAX_WORKBOOK_SIZE_BYTES,
  validateWorkbookFile,
  WORKBOOK_UPLOAD_CONCURRENCY,
} from './WorkbookBatchUpload'

function workbook(name: string, bytes = 'xlsx'): File {
  return new File([bytes], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('workbook batch upload limits', () => {
  it('uses three parallel pipelines and caps one selection at twenty files', () => {
    expect(WORKBOOK_UPLOAD_CONCURRENCY).toBe(3)
    expect(MAX_WORKBOOK_BATCH_SIZE).toBe(20)
  })

  it('accepts a non-empty XLSX within the per-file limit', () => {
    expect(validateWorkbookFile(workbook('QPT-1.XLSX'))).toBeNull()
  })

  it('rejects unsupported, empty, and oversized files independently', () => {
    expect(validateWorkbookFile(workbook('qpt.csv'))).toMatch(/\.xlsx extension/i)
    expect(validateWorkbookFile(new File([], 'empty.xlsx'))).toMatch(/empty/i)

    const oversized = workbook('oversized.xlsx')
    Object.defineProperty(oversized, 'size', { value: MAX_WORKBOOK_SIZE_BYTES + 1 })
    expect(validateWorkbookFile(oversized)).toMatch(/10 MB upload limit/i)
  })
})
