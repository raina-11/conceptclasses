export const PORTAL_IDLE_TIMEOUT_MS = 30 * 60 * 1_000

const ACTIVITY_KEY_PREFIX = 'concept-qpt:last-activity:'
const SIGN_OUT_KEY_PREFIX = 'concept-qpt:sign-out:'

export function portalActivityKey(userId: string): string {
  return `${ACTIVITY_KEY_PREFIX}${userId}`
}

export function portalSignOutKey(userId: string): string {
  return `${SIGN_OUT_KEY_PREFIX}${userId}`
}

export function parsePortalActivity(value: string | null): number | null {
  if (value === null) return null
  const timestamp = Number(value)
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error('The stored portal activity timestamp is invalid.')
  }
  return timestamp
}

export function readPortalActivity(userId: string): number | null {
  return parsePortalActivity(window.localStorage.getItem(portalActivityKey(userId)))
}

export function writePortalActivity(userId: string, timestamp = Date.now()): void {
  window.localStorage.setItem(portalActivityKey(userId), String(timestamp))
}

export function clearPortalActivity(userId: string): void {
  window.localStorage.removeItem(portalActivityKey(userId))
}

export function broadcastPortalSignOut(userId: string): void {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  window.localStorage.setItem(
    portalSignOutKey(userId),
    `${Date.now()}:${randomPart}`,
  )
}

export function portalSessionExpired(lastActivityAt: number, now = Date.now()): boolean {
  const elapsed = now - lastActivityAt
  return elapsed < 0 || elapsed >= PORTAL_IDLE_TIMEOUT_MS
}
