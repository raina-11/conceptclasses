import { describe, expect, it } from 'vitest'
import { normalizedResultDigest } from './result-digest'

const parsed = {
  parserVersion: 'legacy-sheet1-v1',
  assessment: {
    assessmentCode: 'QPT-1-2026-06-01-TEST-A',
    qptNumber: 1,
    batchCode: 'TEST-A',
    testDate: '2026-06-01',
  },
  subjects: [
    { sourceColumn: 4, code: 'MATHS', name: 'Maths', maxMarks: '80' },
  ],
  rows: [
    {
      sourceRow: 4,
      rollNo: 'TEST-002',
      studentNameForReview: 'Test Student 002',
      subjectCode: 'MATHS',
      maxMarks: '80',
      score: '70',
      status: 'PRESENT',
      sourceRank: 1,
    },
    {
      sourceRow: 5,
      rollNo: 'TEST-001',
      studentNameForReview: 'Test Student 001',
      subjectCode: 'MATHS',
      maxMarks: '80',
      score: '60',
      status: 'PRESENT',
      sourceRank: 2,
    },
  ],
}

describe('normalizedResultDigest', () => {
  it('is unchanged by source row numbers, source columns, and row order', async () => {
    const reordered = {
      ...parsed,
      subjects: [{ ...parsed.subjects[0], sourceColumn: 8 }],
      rows: [
        { ...parsed.rows[1], sourceRow: 44 },
        { ...parsed.rows[0], sourceRow: 45 },
      ],
    }

    expect(await normalizedResultDigest(parsed)).toBe(
      await normalizedResultDigest(reordered),
    )
  })

  it('changes when a published score changes', async () => {
    const changed = {
      ...parsed,
      rows: [parsed.rows[0], { ...parsed.rows[1], score: '61' }],
    }

    expect(await normalizedResultDigest(parsed)).not.toBe(
      await normalizedResultDigest(changed),
    )
  })

  it('returns a lowercase SHA-256 digest', async () => {
    expect(await normalizedResultDigest(parsed)).toMatch(/^[0-9a-f]{64}$/)
  })
})
