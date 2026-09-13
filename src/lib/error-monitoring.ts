import * as Sentry from "@sentry/react"
import type { ErrorEvent as SentryErrorEvent, EventHint } from "@sentry/react"
import { redactTelemetry } from "./telemetry-redaction"

/**
 * Fraction of transactions traced. Low by default: Trove is a low-traffic
 * personal app, so a small sample still yields plenty of frontend→backend
 * traces without spending quota on a workload that rarely misbehaves.
 * Override with VITE_SENTRY_TRACES_SAMPLE_RATE.
 */
const DEFAULT_TRACES_SAMPLE_RATE = 0.1

/**
 * Initialises Sentry when VITE_SENTRY_DSN is set; a complete no-op otherwise,
 * so local dev without a DSN ships zero events.
 *
 * Called at module scope from main.tsx rather than lazily, and the SDK is a
 * static import rather than a dynamic one. That is deliberate: Sentry installs
 * its global error and unhandledrejection handlers inside init(), so anything
 * that defers init past first paint cannot see a crash during boot — which is
 * exactly the class of failure worth catching. Awaiting an import() here would
 * make capture of early errors a race against a chunk fetch.
 *
 * Session replay is deliberately not enabled. It records the DOM, and this app
 * displays users' possessions, valuations and photographs; switching it on is
 * a material change to what leaves the browser and should be reflected in the
 * privacy policy first. Add replayIntegration() here when that is settled.
 */
export function initErrorMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    // Ties an error to the exact deploy that introduced it, and lets Sentry
    // resolve minified frames against the source maps uploaded for this SHA.
    release: __APP_RELEASE__,
    environment: import.meta.env.MODE,
    tracesSampleRate: parseSampleRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      DEFAULT_TRACES_SAMPLE_RATE
    ),
    // Redacted after the noise filter: URLs, breadcrumbs and messages can carry
    // credentials or addresses.
    beforeSend(event, hint) {
      return shouldSuppressEvent(event, hint) ? null : redactTelemetry(event)
    },
    // Transactions carry the page URL too, and skip beforeSend.
    beforeSendTransaction(event) {
      return redactTelemetry(event)
    },
    integrations: [Sentry.browserTracingIntegration()],
  })
}

/**
 * Parses a sample-rate environment variable (a string like "0.1") into a
 * number in [0, 1], falling back for unset, non-numeric or out-of-range input
 * rather than letting a typo silently disable or maximise a category.
 */
function parseSampleRate(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : fallback
}

/**
 * Whether an event is non-actionable noise that beforeSend should drop.
 *
 * React Query aborts in-flight requests when a component unmounts or a newer
 * request supersedes an older one, and orval-client.ts forwards that signal
 * to Ky. The resulting AbortError is intentional cancellation, never a fault,
 * and the rejection surfaces from the cancelled request's own promise rather
 * than from a call site we could catch — so it is dropped here instead.
 *
 * Browsers word it differently ("Fetch is aborted", "signal is aborted without
 * reason"), so match on the error's name rather than its message.
 */
export function shouldSuppressEvent(
  event: SentryErrorEvent,
  hint?: EventHint
): boolean {
  const exceptionType = event.exception?.values?.[0]?.type
  const originalName = (
    hint?.originalException as { name?: unknown } | undefined
  )?.name
  return exceptionType === "AbortError" || originalName === "AbortError"
}

/** Reports an unexpected error. Safe to call when monitoring is disabled. */
export function captureException(error: unknown) {
  Sentry.captureException(error)
}

/** Associates later reports with the current user, by id only, or clears it on logout. */
export function setErrorMonitoringUser(user: { id: string } | null) {
  Sentry.setUser(user ? { id: user.id } : null)
}
