import { useEffect, useMemo, useState } from 'react'
import type {
  LinkedStudent,
  PortalRepository,
  StudentQptInsight,
} from '../data/portal-repository'
import {
  filterResultRows,
  resultPercentage,
  summarizeResults,
  type ResultStatus,
  type StudentResultRow,
} from '../domain/qpt/result-summary'
import { PageStatus } from '../components/PageStatus'
import { QptInsights } from '../components/QptInsights'

type StudentDashboardProps = {
  repository: PortalRepository
  students: LinkedStudent[]
}

const STATUS_LABELS: Record<ResultStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  withheld: 'Withheld',
  cancelled: 'Cancelled',
  not_enrolled: 'Not enrolled',
  omitted: 'Omitted',
}

function displayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function displayMark(value: string | number): string {
  return String(value)
}

function scoreCell(row: StudentResultRow) {
  if (row.status === 'present' && row.score !== null) {
    return <span className="numeric-value">{displayMark(row.score)}</span>
  }
  return <span className={`status-badge status-${row.status}`}>{STATUS_LABELS[row.status]}</span>
}

function ResultsTable({ rows }: { rows: StudentResultRow[] }) {
  const summary = summarizeResults(rows)

  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="QPT result table. Scroll horizontally on small screens.">
      <table className="results-table">
        <caption className="sr-only">Published QPT results and visible grand totals</caption>
        <thead>
          <tr>
            <th scope="col">QPT</th>
            <th scope="col">Subject</th>
            <th scope="col">Date</th>
            <th scope="col" className="number-column">Max marks</th>
            <th scope="col" className="number-column">Score</th>
            <th scope="col" className="number-column">Percentage</th>
            <th scope="col" className="number-column">Rank</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const percentage = resultPercentage(row)
            return (
              <tr key={`${row.assessmentId}-${row.subjectCode}`}>
                <th scope="row">
                  <span className="qpt-number">QPT {row.qptNumber}</span>
                  <small>{row.displayTitle}</small>
                </th>
                <td>{row.subjectName}</td>
                <td><time dateTime={row.testDate}>{displayDate(row.testDate)}</time></td>
                <td className="number-column">{displayMark(row.maxMarks)}</td>
                <td className="number-column">{scoreCell(row)}</td>
                <td className="number-column">{percentage === null ? '—' : `${percentage}%`}</td>
                <td className="number-column">{row.rank ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr data-testid="grand-totals">
            <th scope="row" colSpan={3}>Grand total</th>
            <td colSpan={2} className="number-column">{summary.earnedMarks} / {summary.maximumMarks}</td>
            <td className="number-column">
              {summary.percentage === null ? 'Pending' : `${summary.percentage}%`}
            </td>
            <td className="number-column">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function StudentDashboard({ repository, students }: StudentDashboardProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [subject, setSubject] = useState('ALL')
  const [rows, setRows] = useState<StudentResultRow[]>([])
  const [loading, setLoading] = useState(Boolean(students[0]))
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<StudentQptInsight[]>([])
  const [insightsState, setInsightsState] = useState<'loading' | 'ready' | 'error'>(
    students[0] ? 'loading' : 'ready',
  )
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!studentId) return
    let active = true
    setLoading(true)
    setError(null)
    setSubject('ALL')
    setInsights([])
    setInsightsState('loading')
    void repository
      .getStudentResults(studentId)
      .then((nextRows) => {
        if (active) setRows(nextRows)
      })
      .catch(() => {
        if (active) setError('Your results could not be loaded. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    void repository
      .getStudentQptInsights(studentId)
      .then((nextInsights) => {
        if (!active) return
        setInsights(nextInsights)
        setInsightsState('ready')
      })
      .catch(() => {
        if (active) setInsightsState('error')
      })
    return () => {
      active = false
    }
  }, [repository, studentId, reloadKey])

  const selectedStudent = students.find((student) => student.id === studentId)
  const subjects = useMemo(() => {
    const unique = new Map<string, string>()
    rows.forEach((row) => unique.set(row.subjectCode, row.subjectName))
    return [...unique.entries()].sort((left, right) => left[1].localeCompare(right[1]))
  }, [rows])
  const visibleRows = useMemo(() => filterResultRows(rows, subject), [rows, subject])
  const summary = useMemo(() => summarizeResults(visibleRows), [visibleRows])

  if (students.length === 0) {
    return (
      <main className="page-main" id="main-content" tabIndex={-1}>
        <PageStatus
          title="No student profile is linked"
          message="Ask the institute office to link your account to a student roll number."
        />
      </main>
    )
  }

  return (
    <main className="page-main" id="main-content" tabIndex={-1}>
      <section className="page-heading dashboard-heading" aria-labelledby="results-title">
        <div>
          <p className="eyebrow">Performance record</p>
          <h1 id="results-title">Your QPT results</h1>
          <p>Every published assessment, with subject-wise marks and rank.</p>
        </div>
        <div className="profile-chip" aria-label="Selected student summary">
          <span className="avatar" aria-hidden="true">{selectedStudent?.fullName.charAt(0) ?? 'S'}</span>
          <span>
            <strong>{selectedStudent?.fullName}</strong>
            <small>Roll {selectedStudent?.rollNo} · {selectedStudent?.batchCode}</small>
          </span>
        </div>
      </section>

      <section className="filters-card" aria-label="Result filters">
        <div className="field field-compact">
          <label htmlFor="student-filter">Student</label>
          <select id="student-filter" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName} · Roll {student.rollNo}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-compact">
          <label htmlFor="subject-filter">Subject</label>
          <select id="subject-filter" value={subject} onChange={(event) => setSubject(event.target.value)} disabled={loading || rows.length === 0}>
            <option value="ALL">All subjects</option>
            {subjects.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
        <div className="filter-summary" aria-live="polite">
          <span>{visibleRows.length} result{visibleRows.length === 1 ? '' : 's'}</span>
          <strong>{summary.percentage === null ? '—' : `${summary.percentage}%`}</strong>
          <small>visible total</small>
        </div>
      </section>

      {!loading && !error && rows.length > 0 && (
        insightsState === 'loading' ? (
          <section className="qpt-insights qpt-insights-loading" aria-label="QPT insights">
            <div className="inline-status" role="status">
              <span className="spinner" aria-hidden="true" />
              Calculating QPT insights…
            </div>
          </section>
        ) : insightsState === 'error' ? (
          <section className="qpt-insights qpt-insights-error" aria-label="QPT insights">
            <p className="eyebrow">Performance insights</p>
            <h2>QPT comparison</h2>
            <p>QPT insights are temporarily unavailable.</p>
          </section>
        ) : (
          <QptInsights insights={insights} />
        )
      )}

      {loading ? (
        <PageStatus title="Loading results" message="Getting the latest published QPT scores…" kind="loading" />
      ) : error ? (
        <PageStatus title="Results unavailable" message={error} kind="error" onRetry={() => setReloadKey((value) => value + 1)} />
      ) : rows.length === 0 ? (
        <PageStatus title="No published results yet" message="Published QPT results will appear here as soon as they are released." />
      ) : visibleRows.length === 0 ? (
        <PageStatus title="No results for this subject" message="Choose another subject or view all subjects." />
      ) : (
        <section className="results-card" aria-labelledby="result-table-title">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Published record</p>
              <h2 id="result-table-title">Assessment history</h2>
            </div>
            <span className="batch-label">{selectedStudent?.batchName}</span>
          </div>
          <ResultsTable rows={visibleRows} />
          {summary.pendingRows > 0 && (
            <p className="table-note">The grand percentage is pending while one or more results are withheld.</p>
          )}
        </section>
      )}
    </main>
  )
}
