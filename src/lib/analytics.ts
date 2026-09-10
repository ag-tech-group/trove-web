import type { AnyRouter } from "@tanstack/react-router"

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY

/**
 * Ingest host. Production points this at the first-party `/relay` path (see
 * nginx.conf.template) so content blockers cannot drop events by blocking
 * *.i.posthog.com. Falls back to PostHog US cloud for direct ingestion.
 */
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"

/**
 * Path of the last pageview sent, so the same one is never counted twice.
 *
 * This exists because init is a race. The SDK is fetched with a dynamic
 * import, so it may finish either before or after the router resolves the
 * landing route, and the two orderings need different handling: resolve-first
 * means the landing pageview has already been missed and must be sent
 * explicitly, while import-first means the subscription below will report it
 * and an explicit send would duplicate it. Recording the path covers both
 * without having to know which happened.
 */
let lastCapturedPath: string | undefined

/**
 * Initialises PostHog and reports pageviews on route changes. No-ops entirely
 * when VITE_POSTHOG_KEY is unset, and lazy-loads the SDK so it neither ships
 * in the bundle nor competes with first paint when analytics are disabled.
 */
export async function initAnalytics(router: AnyRouter) {
  if (!POSTHOG_KEY) return

  const { default: posthog } = await import("posthog-js")

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    // Pageviews are sent manually below: PostHog's own capture_pageview only
    // fires on initial load, which in an SPA misses every later navigation.
    capture_pageview: false,
    capture_pageleave: true,
    // SESSION REPLAY IS OFF IN CODE, NOT JUST IN THE DASHBOARD. The project had
    // it recording every session with default masking, which hides form inputs
    // but not text on the page — so item names, descriptions and valuations
    // were eligible to be recorded. A dashboard toggle can be switched back on
    // by anyone with access and nothing here would notice. This flag stops the
    // SDK starting a recording on its own, whatever the dashboard says; the only
    // other way in is posthog.startSessionRecording(), which nothing calls. So
    // turning replay on becomes a reviewed change to this file — pair it with a
    // privacy-policy update.
    disable_session_recording: true,
    // Autocapture is on by choice. It records clicks and form interactions,
    // including the text of the element clicked. The project setting can still
    // switch it off server-side; this states the intent rather than forcing it.
    autocapture: true,
  })

  const capture = (path: string) => {
    if (path === lastCapturedPath) return
    lastCapturedPath = path
    posthog.capture("$pageview")
  }

  // The route the user actually landed on. Sent before subscribing because by
  // now it has usually already resolved, and it is the single most valuable
  // pageview there is — an entry point with no referrer of its own.
  capture(router.state.location.pathname)

  router.subscribe("onResolved", ({ toLocation }) => {
    capture(toLocation.pathname)
  })
}
