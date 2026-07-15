import type { PortalSession } from '../data/portal-repository'
import { PortalBrand } from './PortalBrand'

type PortalView = 'results' | 'admin'

type PortalHeaderProps = {
  session: PortalSession
  showResults: boolean
  showAdmin: boolean
  currentView: PortalView
  onNavigate: (view: PortalView) => void
  onSignOut: () => Promise<void>
  navigationDisabled?: boolean
  signOutDisabled?: boolean
  busyDescription?: string
  busyDescriptionId?: string
}

export function PortalHeader({
  session,
  showResults,
  showAdmin,
  currentView,
  onNavigate,
  onSignOut,
  navigationDisabled = false,
  signOutDisabled = false,
  busyDescription = 'Finish the active admin operation before signing out.',
  busyDescriptionId,
}: PortalHeaderProps) {
  return (
    <header className="portal-header">
      <PortalBrand />

      <nav className="portal-nav" aria-label="Portal navigation">
        {showResults && (
          <button
            className="nav-link"
            type="button"
            disabled={navigationDisabled}
            aria-describedby={navigationDisabled ? busyDescriptionId : undefined}
            aria-current={currentView === 'results' ? 'page' : undefined}
            onClick={() => onNavigate('results')}
          >
            Results
          </button>
        )}
        {showAdmin && (
          <button
            className="nav-link"
            type="button"
            disabled={navigationDisabled}
            aria-describedby={navigationDisabled ? busyDescriptionId : undefined}
            aria-current={currentView === 'admin' ? 'page' : undefined}
            onClick={() => onNavigate('admin')}
          >
            Admin
          </button>
        )}
      </nav>

      <div className="account-actions">
        <span className="account-email" title={session.accountLabel}>{session.accountLabel}</span>
        <button
          className="button button-quiet button-small"
          type="button"
          disabled={signOutDisabled}
          aria-describedby={signOutDisabled ? busyDescriptionId : undefined}
          title={signOutDisabled ? busyDescription : undefined}
          onClick={() => void onSignOut()}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export type { PortalView }
