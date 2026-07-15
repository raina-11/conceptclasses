import { useId, useMemo, useState } from 'react'
import type { StudentQptInsight } from '../data/portal-repository'
import type { ResultStatus } from '../domain/qpt/result-summary'

type QptInsightsProps = {
  insights: StudentQptInsight[]
}

type Comparison = {
  key: 'student' | 'average' | 'highest'
  label: string
  value: string | null
  displayValue: string
}

const STATUS_LABELS: Record<ResultStatus, string> = {
  present: 'Pending',
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

function displayStudentScore(insight: StudentQptInsight): string {
  return insight.studentScore ?? STATUS_LABELS[insight.status]
}

function marks(value: string | null, maxMarks: string, fallback: string): string {
  return value === null ? fallback : `${value} / ${maxMarks}`
}

function barWidth(value: string | null, maxMarks: string): string {
  if (value === null) return '0%'
  const score = Number(value)
  const maximum = Number(maxMarks)
  if (!Number.isFinite(score) || !Number.isFinite(maximum) || maximum <= 0) {
    return '0%'
  }
  return `${Math.min(100, Math.max(0, (score / maximum) * 100))}%`
}

function comparisons(insight: StudentQptInsight): Comparison[] {
  return [
    {
      key: 'student',
      label: 'Your score',
      value: insight.studentScore,
      displayValue: marks(
        insight.studentScore,
        insight.maxMarks,
        STATUS_LABELS[insight.status],
      ),
    },
    {
      key: 'average',
      label: 'Batch average',
      value: insight.averageScore,
      displayValue: marks(insight.averageScore, insight.maxMarks, 'Not available'),
    },
    {
      key: 'highest',
      label: 'Batch highest',
      value: insight.highestScore,
      displayValue: marks(insight.highestScore, insight.maxMarks, 'Not available'),
    },
  ]
}

export function QptInsights({ insights }: QptInsightsProps) {
  const componentId = useId()
  const assessments = useMemo(() => {
    const grouped = new Map<string, StudentQptInsight[]>()
    for (const insight of insights) {
      const rows = grouped.get(insight.assessmentId)
      if (rows) rows.push(insight)
      else grouped.set(insight.assessmentId, [insight])
    }
    return [...grouped.entries()]
  }, [insights])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(
    assessments[0]?.[0] ?? '',
  )
  const effectiveAssessmentId = assessments.some(
    ([assessmentId]) => assessmentId === selectedAssessmentId,
  )
    ? selectedAssessmentId
    : (assessments[0]?.[0] ?? '')
  const selectedInsights = assessments.find(
    ([assessmentId]) => assessmentId === effectiveAssessmentId,
  )?.[1] ?? []
  const selectedAssessment = selectedInsights[0]

  if (insights.length === 0) {
    return (
      <section className="qpt-insights qpt-insights-empty" aria-labelledby={`${componentId}-title`}>
        <p className="eyebrow">Performance insights</p>
        <h2 id={`${componentId}-title`}>QPT comparison</h2>
        <p>Comparison metrics will appear after a published QPT has enough batch results.</p>
      </section>
    )
  }

  return (
    <section className="qpt-insights" aria-labelledby={`${componentId}-title`}>
      <div className="qpt-insights-heading">
        <div>
          <p className="eyebrow">Performance insights</p>
          <h2 id={`${componentId}-title`}>Your QPT comparison</h2>
          <p>See your marks alongside the batch average and highest score.</p>
        </div>

        {assessments.length > 1 && (
          <div className="field field-compact qpt-insights-select">
            <label htmlFor={`${componentId}-assessment`}>Assessment</label>
            <select
              id={`${componentId}-assessment`}
              value={effectiveAssessmentId}
              onChange={(event) => setSelectedAssessmentId(event.target.value)}
            >
              {assessments.map(([assessmentId, rows]) => {
                const assessment = rows[0]
                return (
                  <option key={assessmentId} value={assessmentId}>
                    QPT {assessment.qptNumber} · {assessment.displayTitle}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {selectedAssessment && (
        <p className="qpt-insights-context">
          <strong>QPT {selectedAssessment.qptNumber}</strong>
          {' · '}{selectedAssessment.displayTitle}
          {' · '}<time dateTime={selectedAssessment.testDate}>{displayDate(selectedAssessment.testDate)}</time>
        </p>
      )}

      <div className="qpt-insights-subjects">
        {selectedInsights.map((insight, index) => {
          const subjectTitleId = `${componentId}-subject-${index}`
          const chartTitleId = `${componentId}-chart-${index}`
          const values = comparisons(insight)

          return (
            <article
              className="qpt-insight-subject"
              key={`${insight.assessmentId}-${insight.subjectCode}`}
              aria-labelledby={subjectTitleId}
            >
              <div className="qpt-insight-subject-heading">
                <div>
                  <p className="eyebrow">{insight.subjectCode}</p>
                  <h3 id={subjectTitleId}>{insight.subjectName}</h3>
                </div>
                <span className="batch-label">Maximum {insight.maxMarks}</span>
              </div>

              <dl className="insight-metrics">
                <div className="insight-metric insight-metric-student">
                  <dt>Your score</dt>
                  <dd>{marks(insight.studentScore, insight.maxMarks, STATUS_LABELS[insight.status])}</dd>
                </div>
                <div className="insight-metric insight-metric-average">
                  <dt>Batch average</dt>
                  <dd>{marks(insight.averageScore, insight.maxMarks, 'Not available')}</dd>
                </div>
                <div className="insight-metric insight-metric-highest">
                  <dt>Batch highest</dt>
                  <dd>{marks(insight.highestScore, insight.maxMarks, 'Not available')}</dd>
                </div>
                <div className="insight-metric insight-metric-rank">
                  <dt>Subject rank</dt>
                  <dd>
                    {insight.rank === null ? 'Not ranked' : insight.rank}
                    <small>{insight.participantCount} participant{insight.participantCount === 1 ? '' : 's'}</small>
                  </dd>
                </div>
              </dl>

              <div className="comparison-chart" aria-labelledby={chartTitleId}>
                <h4 id={chartTitleId}>Marks comparison</h4>
                <p className="sr-only">All bars use {insight.maxMarks} marks as their maximum.</p>
                <ul className="comparison-bars">
                  {values.map((comparison) => (
                    <li className="comparison-row" key={comparison.key}>
                      <span className="comparison-label">{comparison.label}</span>
                      <span className="comparison-value">{comparison.displayValue}</span>
                      <span className="comparison-track" aria-hidden="true">
                        <span
                          className={`comparison-fill comparison-${comparison.key}`}
                          data-testid={`${comparison.key}-bar-${insight.subjectCode}`}
                          style={{ width: barWidth(comparison.value, insight.maxMarks) }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>

      <div
        className="table-scroll qpt-insights-table"
        tabIndex={0}
        role="region"
        aria-label="Exact QPT performance values. Scroll horizontally on small screens."
      >
        <table className="results-table">
          <caption>Exact marks for QPT {selectedAssessment?.qptNumber}</caption>
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col" className="number-column">Your score</th>
              <th scope="col" className="number-column">Batch average</th>
              <th scope="col" className="number-column">Batch highest</th>
              <th scope="col" className="number-column">Rank</th>
              <th scope="col" className="number-column">Participants</th>
            </tr>
          </thead>
          <tbody>
            {selectedInsights.map((insight) => (
              <tr key={`${insight.assessmentId}-${insight.subjectCode}-exact`}>
                <th scope="row">{insight.subjectName}</th>
                <td className="number-column">
                  {marks(insight.studentScore, insight.maxMarks, displayStudentScore(insight))}
                </td>
                <td className="number-column">
                  {marks(insight.averageScore, insight.maxMarks, 'Not available')}
                </td>
                <td className="number-column">
                  {marks(insight.highestScore, insight.maxMarks, 'Not available')}
                </td>
                <td className="number-column">
                  {insight.rank === null ? 'Not ranked' : insight.rank}
                </td>
                <td className="number-column">{insight.participantCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
