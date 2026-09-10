const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

type SentryModule = typeof import("@sentry/react")
let sentry: SentryModule | undefined

/**
 * Initializes Sentry error monitoring. No-ops entirely when
 * VITE_SENTRY_DSN isn't set (e.g. local dev), and lazy-loads the SDK so
 * it never adds to the bundle when monitoring is disabled.
 *
 * Scoped to error capture only (uncaught exceptions, unhandled
 * rejections, and route render errors via the app's ErrorBoundary) -
 * no performance tracing, no reporting of expected/handled API errors
 * that are already surfaced to users via toast.
 */
export async function initErrorMonitoring() {
  if (!SENTRY_DSN) return

  sentry = await import("@sentry/react")
  sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
  })
}

/** Reports an unexpected error to Sentry. Safe to call even if monitoring is disabled. */
export function captureException(error: unknown) {
  sentry?.captureException(error)
}

/** Associates subsequent error reports with the current user, or clears it on logout. */
export function setErrorMonitoringUser(
  user: { id: string; email: string } | null
) {
  sentry?.setUser(user ? { id: user.id, email: user.email } : null)
}
