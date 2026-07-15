import { useCallback, useEffect, useRef, useState } from 'react'
import { PageStatus } from './components/PageStatus'
import { PortalHeader, type PortalView } from './components/PortalHeader'
import type {
  PortalContext,
  PortalRepository,
  PortalSession,
} from './data/portal-repository'
import { canPublishResults, canUploadResults } from './data/portal-repository'
import { browserPortalRepository } from './data/supabase-portal-repository'
import { AdminPage, type CredentialProtectionState } from './pages/AdminPage'
import { InitialPasswordPage } from './pages/InitialPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { StudentDashboard } from './pages/StudentDashboard'
import {
  PORTAL_IDLE_TIMEOUT_MS,
  broadcastPortalSignOut,
  clearPortalActivity,
  parsePortalActivity,
  portalActivityKey,
  portalSessionExpired,
  portalSignOutKey,
  readPortalActivity,
  writePortalActivity,
} from './security/session-activity'

type AppProps = {
  repository?: PortalRepository
  initialView?: PortalView
}

export { PORTAL_IDLE_TIMEOUT_MS } from './security/session-activity'

export const PORTAL_CONTEXT_TIMEOUT_MS = 12_000

function viewFromLocation(): PortalView {
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'results'
}

function accessibleView(
  requestedView: PortalView,
  hasResultsAccess: boolean,
  hasAdminAccess: boolean,
): PortalView {
  if (requestedView === 'results' && hasResultsAccess) return 'results'
  if (requestedView === 'admin' && hasAdminAccess) return 'admin'
  return hasAdminAccess ? 'admin' : 'results'
}

export function App({
  repository = browserPortalRepository,
  initialView,
}: AppProps) {
  const [session, setSession] = useState<PortalSession | null | undefined>(undefined)
  const [context, setContext] = useState<PortalContext | null>(null)
  const [contextState, setContextState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [contextReload, setContextReload] = useState(0)
  const [view, setView] = useState<PortalView>(initialView ?? viewFromLocation)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [loginNotice, setLoginNotice] = useState<string | null>(null)
  const [credentialProtection, setCredentialProtection] = useState<CredentialProtectionState>('clear')
  const interactiveSignIn = useRef(false)
  const hasAdminAccess = context
    ? canUploadResults(context.roles) || canPublishResults(context.roles)
    : false
  const hasResultsAccess = context
    ? context.students.length > 0 || !hasAdminAccess
    : false
  const currentView = context
    ? accessibleView(view, hasResultsAccess, hasAdminAccess)
    : view

  const canDiscardCredentialPage = useCallback((): boolean => {
    if (credentialProtection === 'clear') return true
    if (credentialProtection === 'busy') {
      setSignOutError('Finish preparing the student credential file before leaving this page.')
      return false
    }
    return window.confirm(
      'Temporary credentials are still available only on this page for recovery. Leave and permanently discard this in-memory copy?',
    )
  }, [credentialProtection])

  useEffect(() => {
    let active = true
    let expiring = false
    let authEventSeen = false
    let currentUserId: string | null = null
    const pendingAuthChanges = new Set<number>()

    const expirePersistedSession = (userId: string) => {
      if (expiring) return
      expiring = true
      try {
        clearPortalActivity(userId)
        broadcastPortalSignOut(userId)
      } catch {
        // The UI still fails closed if browser storage is unavailable.
      }
      if (active) {
        setSession(null)
        setContext(null)
      }
      void repository.signOut().catch(() => undefined)
    }

    const acceptSession = (nextSession: PortalSession | null) => {
      if (!active) return
      const freshAuthentication = interactiveSignIn.current
      if (freshAuthentication) expiring = false
      if (expiring && nextSession) return
      if (!nextSession) {
        if (currentUserId) {
          try {
            clearPortalActivity(currentUserId)
          } catch {
            // There is no authenticated UI left to protect.
          }
        }
        currentUserId = null
        setSession(null)
        setContext(null)
        return
      }

      currentUserId = nextSession.userId
      try {
        if (freshAuthentication) {
          writePortalActivity(nextSession.userId)
          setSession(nextSession)
          return
        }

        const lastActivityAt = readPortalActivity(nextSession.userId)
        if (lastActivityAt === null || portalSessionExpired(lastActivityAt)) {
          expirePersistedSession(nextSession.userId)
          return
        }
      } catch {
        expirePersistedSession(nextSession.userId)
        return
      }
      setSession(nextSession)
    }

    const unsubscribe = repository.onAuthChange((nextSession) => {
      authEventSeen = true
      // Supabase Auth holds an internal lock while notifying listeners. Let
      // that callback fully unwind before a React effect can start another
      // Supabase request, otherwise the next request can wait indefinitely.
      const timer = window.setTimeout(() => {
        pendingAuthChanges.delete(timer)
        acceptSession(nextSession)
      }, 0)
      pendingAuthChanges.add(timer)
    })
    void repository
      .getSession()
      .then((nextSession) => {
        if (!authEventSeen) acceptSession(nextSession)
      })
      .catch(() => {
        if (active) setSession(null)
      })
    return () => {
      active = false
      pendingAuthChanges.forEach((timer) => window.clearTimeout(timer))
      unsubscribe()
    }
  }, [repository])

  useEffect(() => {
    if (!session) {
      setContext(null)
      setContextState('idle')
      return
    }
    let active = true
    let deadline: number | undefined
    setContextState('loading')
    const contextRequest = repository.getPortalContext()
    const contextDeadline = new Promise<PortalContext>((_resolve, reject) => {
      deadline = window.setTimeout(() => {
        reject(new Error('Portal context request timed out.'))
      }, PORTAL_CONTEXT_TIMEOUT_MS)
    })
    void Promise.race([contextRequest, contextDeadline])
      .then((nextContext) => {
        if (active) {
          setContext(nextContext)
          setContextState('idle')
        }
      })
      .catch(() => {
        if (active) setContextState('error')
      })
      .finally(() => {
        if (deadline !== undefined) window.clearTimeout(deadline)
      })
    return () => {
      active = false
      if (deadline !== undefined) window.clearTimeout(deadline)
    }
  }, [contextReload, repository, session])

  useEffect(() => {
    if (initialView) return
    const handlePopState = () => {
      const nextView = viewFromLocation()
      if (
        nextView !== currentView
        && currentView === 'admin'
        && !canDiscardCredentialPage()
      ) {
        window.history.pushState({}, '', '/admin')
        return
      }
      setView(nextView)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [canDiscardCredentialPage, currentView, initialView])

  useEffect(() => {
    if (!context || currentView === view) return

    setView(currentView)
    if (!initialView) {
      window.history.replaceState({}, '', currentView === 'admin' ? '/admin' : '/')
    }
  }, [context, currentView, initialView, view])

  useEffect(() => {
    if (!session?.userId) return

    const userId = session.userId
    let lastActivityAt: number
    let expiryTimer: ReturnType<typeof setTimeout> | undefined
    let expiring = false

    const expireSession = (broadcast = true) => {
      if (expiring) return
      expiring = true
      try {
        clearPortalActivity(userId)
        if (broadcast) broadcastPortalSignOut(userId)
      } catch {
        // A storage failure cannot be allowed to retain authenticated UI.
      }
      // A shared-device timeout must fail closed even if the remote sign-out
      // request cannot complete.
      setSession(null)
      setContext(null)
      setView('results')
      if (!initialView) window.history.replaceState({}, '', '/')
      void repository.signOut().catch(() => undefined)
    }
    const scheduleExpiry = () => {
      if (expiryTimer) clearTimeout(expiryTimer)
      if (portalSessionExpired(lastActivityAt)) {
        expireSession()
        return
      }
      const remaining = PORTAL_IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt)
      expiryTimer = setTimeout(() => expireSession(), remaining)
    }

    const recordActivity = () => {
      if (document.hidden || expiring) return
      lastActivityAt = Date.now()
      try {
        writePortalActivity(userId, lastActivityAt)
      } catch {
        expireSession()
        return
      }
      scheduleExpiry()
    }
    const checkAfterVisibilityChange = () => {
      if (document.hidden) return
      try {
        const storedActivity = readPortalActivity(userId)
        if (storedActivity === null) {
          expireSession()
          return
        }
        lastActivityAt = storedActivity
        scheduleExpiry()
      } catch {
        expireSession()
      }
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return
      if (event.key === portalSignOutKey(userId) && event.newValue !== null) {
        expireSession(false)
        return
      }
      if (event.key !== portalActivityKey(userId)) return
      try {
        const storedActivity = parsePortalActivity(event.newValue)
        if (storedActivity === null) {
          expireSession(false)
          return
        }
        lastActivityAt = storedActivity
        scheduleExpiry()
      } catch {
        expireSession(false)
      }
    }

    try {
      const storedActivity = readPortalActivity(userId)
      if (storedActivity === null) {
        expireSession()
        return
      }
      lastActivityAt = storedActivity
    } catch {
      expireSession()
      return
    }

    const activityEvents = ['keydown', 'pointerdown', 'touchstart'] as const
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, recordActivity, { passive: true })
    }
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', checkAfterVisibilityChange)
    scheduleExpiry()

    return () => {
      if (expiryTimer) clearTimeout(expiryTimer)
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, recordActivity)
      }
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', checkAfterVisibilityChange)
    }
  }, [initialView, repository, session?.userId])

  function navigate(nextView: PortalView, skipCredentialGuard = false) {
    if (
      !skipCredentialGuard
      && nextView !== currentView
      && currentView === 'admin'
      && !canDiscardCredentialPage()
    ) return
    setView(nextView)
    if (!initialView) {
      window.history.pushState({}, '', nextView === 'admin' ? '/admin' : '/')
    }
  }

  async function signOut() {
    setSignOutError(null)
    if (!canDiscardCredentialPage()) return
    try {
      await repository.signOut()
      if (session) {
        try {
          clearPortalActivity(session.userId)
          broadcastPortalSignOut(session.userId)
        } catch {
          // Remote sign-out already succeeded; local state still fails closed.
        }
      }
      setSession(null)
      setContext(null)
      setCredentialProtection('clear')
      navigate('results', true)
    } catch {
      setSignOutError('Sign out failed. Please try again.')
    }
  }

  async function replaceInitialPassword(newPassword: string) {
    await repository.changeInitialPassword(newPassword)
    if (session) {
      try {
        clearPortalActivity(session.userId)
        broadcastPortalSignOut(session.userId)
      } catch {
        // The authenticated UI is cleared below even without browser storage.
      }
    }
    setLoginNotice('Your private password is saved. Sign in again with the new password.')
    setSession(null)
    setContext(null)
    setView('results')
    if (!initialView) window.history.replaceState({}, '', '/')
    repository.discardLocalSession()
  }

  if (session === undefined) {
    return (
      <main className="boot-shell">
        <PageStatus title="Opening your portal" message="Checking your secure session…" kind="loading" />
      </main>
    )
  }

  if (!session) {
    return (
      <LoginPage
        signIn={async (loginId, password) => {
          interactiveSignIn.current = true
          try {
            const nextSession = await repository.signIn(loginId, password)
            setLoginNotice(null)
            try {
              writePortalActivity(nextSession.userId)
            } catch {
              await repository.signOut().catch(() => undefined)
              throw new Error('Secure browser storage is required to sign in.')
            }
            return nextSession
          } finally {
            interactiveSignIn.current = false
          }
        }}
        onSignedIn={setSession}
        notice={loginNotice}
      />
    )
  }

  if (context?.mustChangePassword) {
    return (
      <InitialPasswordPage
        accountLabel={session.accountLabel}
        changePassword={replaceInitialPassword}
        onSignOut={signOut}
      />
    )
  }

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <PortalHeader
        session={session}
        showResults={context !== null && hasResultsAccess}
        showAdmin={context !== null && hasAdminAccess}
        currentView={currentView}
        onNavigate={navigate}
        onSignOut={signOut}
        navigationDisabled={credentialProtection === 'busy'}
        signOutDisabled={credentialProtection === 'busy'}
      />
      {signOutError && <p className="global-alert alert alert-error" role="alert">{signOutError}</p>}

      {contextState === 'loading' || !context ? (
        contextState === 'error' ? (
          <main className="page-main" id="main-content" tabIndex={-1}>
            <PageStatus
              title="Portal details unavailable"
              message="Your linked students and permissions could not be loaded."
              kind="error"
              onRetry={() => setContextReload((value) => value + 1)}
            />
          </main>
        ) : (
          <main className="page-main" id="main-content" tabIndex={-1}>
            <PageStatus title="Preparing your portal" message="Loading linked student details…" kind="loading" />
          </main>
        )
      ) : currentView === 'admin' ? (
        <AdminPage
          repository={repository}
          roles={context.roles}
          onCredentialProtectionChange={setCredentialProtection}
        />
      ) : (
        <StudentDashboard repository={repository} students={context.students} />
      )}
    </div>
  )
}
