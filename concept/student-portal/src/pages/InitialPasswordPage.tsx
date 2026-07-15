import { useState, type FormEvent } from 'react'
import { PortalBrand } from '../components/PortalBrand'

type InitialPasswordPageProps = {
  accountLabel: string
  changePassword: (newPassword: string) => Promise<void>
  onSignOut: () => Promise<void>
}

function passwordPolicyError(password: string): string | null {
  if (password.length < 10) return 'Use at least 10 characters.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include an uppercase letter, a lowercase letter, and a number.'
  }
  return null
}

export function InitialPasswordPage({
  accountLabel,
  changePassword,
  onSignOut,
}: InitialPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const policyError = passwordPolicyError(password)
    if (policyError) {
      setError(policyError)
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match. Please enter them again.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(password)
    } catch {
      setError('We could not save your private password. Please try again or contact the institute office.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card recovery-card" aria-labelledby="initial-password-title">
        <div className="login-intro">
          <PortalBrand login />
          <p className="eyebrow">First sign in</p>
          <h1 id="initial-password-title">Create your private password</h1>
          <p className="login-copy">
            The password provided by Concept is temporary. Replace it before opening any student results.
          </p>
          <div className="trust-note">
            <span aria-hidden="true">✓</span>
            Concept never stores your private password in the portal database or a workbook.
          </div>
        </div>

        <div className="login-form-panel">
          <p className="eyebrow">Account {accountLabel}</p>
          <h2>Secure this account</h2>
          <p id="initial-password-rules">
            Use 10 or more characters with upper and lowercase letters and a number.
          </p>

          <form
            onSubmit={handleSubmit}
            aria-describedby={`initial-password-rules${error ? ' initial-password-error' : ''}`}
          >
            <div className="field">
              <label htmlFor="initial-new-password">New password</label>
              <input
                id="initial-new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="initial-confirm-password">Confirm new password</label>
              <input
                id="initial-confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {error && <p className="alert alert-error" id="initial-password-error" role="alert">{error}</p>}

            <button className="button button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? 'Saving private password…' : 'Save private password'}
            </button>
            <button
              className="button button-quiet button-full recovery-back"
              type="button"
              onClick={() => void onSignOut()}
              disabled={submitting}
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
