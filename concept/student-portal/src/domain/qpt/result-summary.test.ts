import { describe, expect, it } from 'vitest'
import {
  filterResultRows,
  resultPercentage,
  summarizeResults,
  type StudentResultRow,
} from './result-summary'

const rows: StudentResultRow[] = [
  {
    assessmentId: 'assessment-1',
    assessmentCode: 'QPT-1',
    qptNumber: 1,
    displayTitle: 'QPT 1',
    testDate: '2026-06-01',
    subjectCode: 'PHY',
    subjectName: 'Physics',
    maxMarks: '100',
    score: '70',
    status: 'present',
    rank: 2,
  },
  {
    assessmentId: 'assessment-2',
    assessmentCode: 'QPT-2',
    qptNumber: 2,
    displayTitle: 'QPT 2',
    testDate: '2026-06-08',
    subjectCode: 'CHEM',
    subjectName: 'Chemistry',
    maxMarks: '80',
    score: null,
    status: 'absent',
    rank: null,
  },
  {
    assessmentId: 'assessment-3',
    assessmentCode: 'QPT-3',
    qptNumber: 3,
    displayTitle: 'QPT 3',
    testDate: '2026-06-15',
    subjectCode: 'BIO',
    subjectName: 'Biology',
    maxMarks: '50',
    score: null,
    status: 'cancelled',
    rank: null,
  },
]

describe('result summary', () => {
  it('treats absence as zero and excludes cancelled assessments', () => {
    expect(summarizeResults(rows)).toEqual({
      earnedMarks: '70',
      maximumMarks: '180',
      percentage: '38.89',
      includedRows: 2,
      pendingRows: 0,
    })
  })

  it('does not present a misleading percentage while a result is withheld', () => {
    const withWithheld: StudentResultRow[] = [
      ...rows,
      {
        ...rows[0],
        assessmentId: 'assessment-4',
        assessmentCode: 'QPT-4',
        qptNumber: 4,
        subjectCode: 'MATH',
        subjectName: 'Maths',
        maxMarks: '20',
        score: null,
        status: 'withheld',
        rank: null,
      },
    ]

    expect(summarizeResults(withWithheld)).toEqual({
      earnedMarks: '70',
      maximumMarks: '200',
      percentage: null,
      includedRows: 3,
      pendingRows: 1,
    })
  })

  it('filters case-insensitively and recomputes the visible grand total', () => {
    const filtered = filterResultRows(rows, 'phy')

    expect(filtered).toHaveLength(1)
    expect(summarizeResults(filtered).percentage).toBe('70')
  })

  it('preserves negative percentages and returns null for non-score statuses', () => {
    expect(resultPercentage({ maxMarks: '88', score: '-1', status: 'present' })).toBe(
      '-1.14',
    )
    expect(resultPercentage({ maxMarks: '88', score: null, status: 'withheld' })).toBe(
      null,
    )
    expect(resultPercentage({ maxMarks: '88', score: null, status: 'absent' })).toBe(
      '0',
    )
  })
})
