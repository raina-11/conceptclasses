export const DEFAULT_STUDENT_PORTAL_URL =
  "https://students.conceptinstitute.co.in"

const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"])

/**
 * Resolve the build-time portal override without allowing an unsafe link scheme.
 * Plain HTTP is accepted only for a local development server.
 */
export function resolveStudentPortalUrl(configuredUrl) {
  const candidate = configuredUrl?.trim()

  if (!candidate) {
    return DEFAULT_STUDENT_PORTAL_URL
  }

  try {
    const parsedUrl = new URL(candidate)
    const isSecure = parsedUrl.protocol === "https:"
    const isLocalDevelopment =
      parsedUrl.protocol === "http:" &&
      LOCAL_DEVELOPMENT_HOSTS.has(parsedUrl.hostname)

    if (
      (isSecure || isLocalDevelopment) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return candidate
    }
  } catch {
    // Invalid overrides deliberately fall through to the production-safe default.
  }

  return DEFAULT_STUDENT_PORTAL_URL
}

export const STUDENT_PORTAL_URL = resolveStudentPortalUrl(
  process.env.REACT_APP_STUDENT_PORTAL_URL,
)
