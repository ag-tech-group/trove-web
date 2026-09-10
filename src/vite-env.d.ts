/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Trove API. Baked in at build time — see the Dockerfile. */
  readonly VITE_API_URL?: string
  /** Sentry ingest endpoint. Unset = the SDK never initialises. */
  readonly VITE_SENTRY_DSN?: string
  /** Fraction of transactions traced, "0" to "1". Default in error-monitoring.ts. */
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string
  /** PostHog project key. Unset = the SDK never initialises. */
  readonly VITE_POSTHOG_KEY?: string
  /**
   * PostHog ingest host. Production points this at the first-party `/relay`
   * path so blockers can't drop events by blocking *.i.posthog.com; see
   * nginx.conf. Falls back to PostHog US cloud.
   */
  readonly VITE_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.css" {
  const content: string
  export default content
}

/**
 * Build-time release identifier — the commit SHA on CI, "dev" locally.
 * Injected by `define` in vite.config.ts and used as Sentry's release tag so
 * an error can be traced to the exact deploy that introduced it.
 */
declare const __APP_RELEASE__: string
