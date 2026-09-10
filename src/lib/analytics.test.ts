import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AnyRouter } from "@tanstack/react-router"

const init = vi.fn()
const capture = vi.fn()

vi.mock("posthog-js", () => ({ default: { init, capture } }))

/**
 * Minimal stand-in for the router. `emit` replays what TanStack Router hands
 * an onResolved subscriber, so a test can drive navigation without a real
 * route tree.
 */
function makeRouter(pathname: string) {
  const subscribers: Array<
    (event: { toLocation: { pathname: string } }) => void
  > = []
  return {
    state: { location: { pathname } },
    subscribe: (
      _event: string,
      cb: (event: { toLocation: { pathname: string } }) => void
    ) => {
      subscribers.push(cb)
      return () => {}
    },
    navigate(to: string) {
      subscribers.forEach((cb) => cb({ toLocation: { pathname: to } }))
    },
  }
}

async function loadAnalytics() {
  vi.resetModules()
  return await import("./analytics")
}

beforeEach(() => {
  init.mockClear()
  capture.mockClear()
  vi.unstubAllEnvs()
})

describe("initAnalytics", () => {
  it("does nothing at all without a key", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "")
    const { initAnalytics } = await loadAnalytics()
    const router = makeRouter("/")

    await initAnalytics(router as unknown as AnyRouter)

    expect(init).not.toHaveBeenCalled()
    expect(capture).not.toHaveBeenCalled()
  })

  it("reports the landing route the SDK finished loading too late to see", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()
    const router = makeRouter("/items/123")

    await initAnalytics(router as unknown as AnyRouter)

    expect(capture).toHaveBeenCalledTimes(1)
  })

  it("does not double-count when the router also announces that same route", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()
    const router = makeRouter("/items/123")

    await initAnalytics(router as unknown as AnyRouter)
    router.navigate("/items/123")

    expect(capture).toHaveBeenCalledTimes(1)
  })

  it("reports each genuine navigation", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()
    const router = makeRouter("/")

    await initAnalytics(router as unknown as AnyRouter)
    router.navigate("/items")
    router.navigate("/items/123")

    expect(capture).toHaveBeenCalledTimes(3)
  })

  it("points the SDK at the relay host when one is configured", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    vi.stubEnv("VITE_POSTHOG_HOST", "https://trovebox.io/relay")
    const { initAnalytics } = await loadAnalytics()

    await initAnalytics(makeRouter("/") as unknown as AnyRouter)

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ api_host: "https://trovebox.io/relay" })
    )
  })

  it("falls back to PostHog cloud when no relay is configured", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    vi.stubEnv("VITE_POSTHOG_HOST", "")
    const { initAnalytics } = await loadAnalytics()

    await initAnalytics(makeRouter("/") as unknown as AnyRouter)

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ api_host: "https://us.i.posthog.com" })
    )
  })

  it("turns session recording off in the SDK config", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()

    await initAnalytics(makeRouter("/") as unknown as AnyRouter)

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ disable_session_recording: true })
    )
  })

  it("leaves autocapture on", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()

    await initAnalytics(makeRouter("/") as unknown as AnyRouter)

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ autocapture: true })
    )
  })

  it("leaves exception capture to Sentry", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
    const { initAnalytics } = await loadAnalytics()

    await initAnalytics(makeRouter("/") as unknown as AnyRouter)

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ capture_exceptions: false })
    )
  })
})
