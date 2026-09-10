import type { AnyRouter } from "@tanstack/react-router"

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"

/**
 * Initializes PostHog and wires up pageview tracking on route changes.
 * No-ops entirely when VITE_POSTHOG_KEY isn't set (e.g. local dev), and
 * lazy-loads the SDK so it never adds to the bundle when analytics are
 * disabled.
 */
export async function initAnalytics(router: AnyRouter) {
  if (!POSTHOG_KEY) return

  const { default: posthog } = await import("posthog-js")

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    // We send pageviews manually on route resolution instead, since
    // capture_pageview only fires once on initial load in an SPA.
    capture_pageview: false,
    capture_pageleave: true,
  })

  router.subscribe("onResolved", ({ pathChanged }) => {
    if (pathChanged) posthog.capture("$pageview")
  })
}
