import { useState, type FormEvent } from 'react'
import type { PortalSession } from '../data/portal-repository'
import { PortalBrand } from '../components/PortalBrand'

type LoginPageProps = {
  signIn: (loginId: string, password: string) => Promise<PortalSession>
  onSignedIn: (session: PortalSession) => void
  notice?: string | null
}

function loginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'The roll number/admin ID or password is incorrect. Please try again.'
  }
  if (message.includes('valid roll number')) {
    return 'Enter a valid roll number or admin ID.'
  }
  return 'We could not sign you in. Check your connection and try again.'
}

export function LoginPage({ signIn, onSignedIn, notice }: LoginPageProps) {
  const [mode, setMode] = useState<'sign-in' | 'forgot-password'>('sign-in')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const nextSession = await signIn(loginId, password)
      onSignedIn(nextSession)
    } catch (signInError) {
      setError(loginErrorMessage(signInError))
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode: 'sign-in' | 'forgot-password') {
    setMode(nextMode)
    setError(null)
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-intro">
          <PortalBrand login />
          <p className="eyebrow">Secure results</p>
          <h1 id="login-title">Your progress,<br />all in one place.</h1>
          <p className="login-copy">
            Sign in to view every published QPT score, subject-wise performance, percentage, and rank.
          </p>
          <p className="security-note">
            For shared-device safety, signed-in sessions close after 30 minutes without keyboard or pointer activity.
          </p>
          <div className="trust-note">
            <span aria-hidden="true">✓</span>
            Only results linked to your account are shown.
          </div>
        </div>

        <div className="login-form-panel">
          {mode === 'sign-in' ? (
            <>
              <p className="eyebrow">Welcome back</p>
              <h2>Student sign in</h2>
              <p>Use the account provided by Concept Institute.</p>
              {notice && <p className="alert alert-success" role="status">{notice}</p>}

              <form onSubmit={handleSubmit} aria-describedby={error ? 'login-error' : undefined}>
                <div className="field">
                  <label htmlFor="login-id">Roll number or admin ID</label>
                  <input
                    id="login-id"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="password">Password</label>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => changeMode('forgot-password')}
                      disabled={submitting}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {error && <p className="alert alert-error" id="login-error" role="alert">{error}</p>}

                <button className="button button-primary button-full" type="submit" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in securely'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="eyebrow">Account recovery</p>
              <h2>Ask Concept for a reset</h2>
              <p>
                Contact the institute office. After confirming the student, an administrator can issue a
                new temporary password. You will create a private password immediately after signing in.
              </p>
              <a className="button button-primary button-full" href="tel:9928111865">
                Call 9928111865
              </a>
              <button
                className="button button-quiet button-full recovery-back"
                type="button"
                onClick={() => changeMode('sign-in')}
              >
                Back to sign in
              </button>
            </>
          )}

          <p className="help-copy">
            Trouble signing in? Contact the institute office at{' '}
            <a href="tel:9928111865">9928111865</a>.
          </p>
        </div>
      </section>
    </main>
  )
}
