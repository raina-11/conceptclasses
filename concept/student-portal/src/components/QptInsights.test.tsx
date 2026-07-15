import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { StudentQptInsight } from '../data/portal-repository'
import { QptInsights } from './QptInsights'

const qptOne: StudentQptInsight[] = [
  {
    assessmentId: 'assessment-one',
    qptNumber: 1,
    displayTitle: 'Foundation check',
    testDate: '2026-07-01',
    subjectCode: 'MATH',
    subjectName: 'Mathematics',
    maxMarks: '40',
    studentScore: '32',
    status: 'present',
    rank: 4,
    highestScore: '39',
    averageScore: '26.5',
    participantCount: 38,
  },
  {
    assessmentId: 'assessment-one',
    qptNumber: 1,
    displayTitle: 'Foundation check',
    testDate: '2026-07-01',
    subjectCode: 'SCI',
    subjectName: 'Science',
    maxMarks: '50',
    studentScore: '41',
    status: 'present',
    rank: 2,
    highestScore: '47',
    averageScore: '35.25',
    participantCount: 40,
  },
]

describe('QptInsights', () => {
  it('shows exact multi-subject metrics and normalized comparison bars', () => {
    render(<QptInsights insights={qptOne} />)

    const mathematics = screen.getByRole('article', { name: 'Mathematics' })
    expect(within(mathematics).getAllByText('32 / 40')).toHaveLength(2)
    expect(within(mathematics).getAllByText('26.5 / 40')).toHaveLength(2)
    expect(within(mathematics).getAllByText('39 / 40')).toHaveLength(2)
    expect(within(mathematics).getByText('38 participants')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Science' })).toBeInTheDocument()
    expect(screen.getByTestId('student-bar-MATH')).toHaveStyle({ width: '80%' })
    expect(screen.getByTestId('highest-bar-SCI')).toHaveStyle({ width: '94%' })

    const exactTable = screen.getByRole('table', { name: 'Exact marks for QPT 1' })
    expect(within(exactTable).getByRole('rowheader', { name: 'Mathematics' })).toBeInTheDocument()
    expect(within(exactTable).getByRole('cell', { name: '4' })).toBeInTheDocument()
    expect(within(exactTable).getByRole('cell', { name: '38' })).toBeInTheDocument()
  })

  it('offers a labelled selector and switches the displayed QPT', async () => {
    const user = userEvent.setup()
    const qptTwo: StudentQptInsight = {
      ...qptOne[0],
      assessmentId: 'assessment-two',
      qptNumber: 2,
      displayTitle: 'Motion and force',
      subjectCode: 'PHY',
      subjectName: 'Physics',
      studentScore: '36',
    }
    render(<QptInsights insights={[...qptOne, qptTwo]} />)

    const selector = screen.getByRole('combobox', { name: 'Assessment' })
    expect(selector).toHaveValue('assessment-one')
    expect(screen.queryByRole('article', { name: 'Physics' })).not.toBeInTheDocument()

    await user.selectOptions(selector, 'assessment-two')

    expect(selector).toHaveValue('assessment-two')
    expect(screen.getByRole('article', { name: 'Physics' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Mathematics' })).not.toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Exact marks for QPT 2' })).toBeInTheDocument()
  })

  it('labels an absent score without inventing a numeric value', () => {
    const absent: StudentQptInsight = {
      ...qptOne[0],
      studentScore: null,
      status: 'absent',
      rank: null,
    }
    render(<QptInsights insights={[absent]} />)

    const exactTable = screen.getByRole('table', { name: 'Exact marks for QPT 1' })
    expect(within(exactTable).getByRole('cell', { name: 'Absent' })).toBeInTheDocument()
    expect(within(exactTable).getByRole('cell', { name: 'Not ranked' })).toBeInTheDocument()
    expect(screen.getByTestId('student-bar-MATH')).toHaveStyle({ width: '0%' })
  })

  it('provides semantic headings, chart labels, and an informative empty state', () => {
    const { rerender } = render(<QptInsights insights={qptOne.slice(0, 1)} />)

    expect(screen.getByRole('heading', { name: 'Your QPT comparison' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Marks comparison' })).toBeInTheDocument()
    expect(screen.getByText('All bars use 40 marks as their maximum.')).toHaveClass('sr-only')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(document.querySelector('svg')).not.toBeInTheDocument()

    rerender(<QptInsights insights={[]} />)
    expect(screen.getByRole('heading', { name: 'QPT comparison' })).toBeInTheDocument()
    expect(screen.getByText(/after a published QPT has enough batch results/i)).toBeInTheDocument()
  })
})
