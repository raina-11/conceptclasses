type PageStatusProps = {
  title: string
  message: string
  kind?: 'loading' | 'error' | 'empty'
  onRetry?: () => void
}

export function PageStatus({
  title,
  message,
  kind = 'empty',
  onRetry,
}: PageStatusProps) {
  const isLoading = kind === 'loading'

  return (
    <section
      className={`page-status page-status-${kind}`}
      aria-live={isLoading ? 'polite' : undefined}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <span className="spinner" aria-hidden="true" />}
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry && (
          <button className="button button-secondary" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </section>
  )
}
