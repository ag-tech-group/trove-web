import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ErrorEvent as SentryErrorEvent, EventHint } from "@sentry/react"
import {
  initErrorMonitoring,
  setErrorMonitoringUser,
  shouldSuppressEvent,
} from "./error-monitoring"

// Hoisted: the mock factory runs before this file's other declarations.
const sentry = vi.hoisted(() => ({ init: vi.fn(), setUser: vi.fn() }))

vi.mock("@sentry/react", () => ({
  init: sentry.init,
  setUser: sentry.setUser,
  captureException: vi.fn(),
  browserTracingIntegration: vi.fn(),
}))

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1LTEifQ.c2lnbmF0dXJl"

/**
 * The filter runs inside beforeSend, where a false positive silently discards
 * a real error — so the negative cases matter as much as the positive ones.
 */
function eventWithType(type?: string): SentryErrorEvent {
  // `type: undefined` is the discriminant that makes this an ErrorEvent rather
  // than a transaction, and Sentry's types require it explicitly.
  return {
    type: undefined,
    ...(type ? { exception: { values: [{ type }] } } : {}),
  }
}

describe("shouldSuppressEvent", () => {
  it("drops an AbortError identified by exception type", () => {
    expect(shouldSuppressEvent(eventWithType("AbortError"))).toBe(true)
  })

  it("drops an AbortError identified only by the original exception", () => {
    const hint = {
      originalException: new DOMException("Fetch is aborted", "AbortError"),
    } as EventHint
    expect(shouldSuppressEvent(eventWithType(), hint)).toBe(true)
  })

  it("keeps a genuine TypeError", () => {
    expect(shouldSuppressEvent(eventWithType("TypeError"))).toBe(false)
  })

  it("keeps an event with no exception at all", () => {
    expect(shouldSuppressEvent(eventWithType())).toBe(false)
  })

  it("keeps an error whose message merely mentions aborting", () => {
    const hint = {
      originalException: new Error("upload aborted by the server"),
    } as EventHint
    expect(shouldSuppressEvent(eventWithType("Error"), hint)).toBe(false)
  })

  it("tolerates a non-object originalException", () => {
    const hint = { originalException: "AbortError" } as EventHint
    expect(shouldSuppressEvent(eventWithType("Error"), hint)).toBe(false)
  })
})

describe("initErrorMonitoring", () => {
  beforeEach(() => {
    sentry.init.mockClear()
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@o0.ingest.sentry.io/0")
    vi.stubGlobal("__APP_RELEASE__", "test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  /** The options the SDK was initialised with, hooks included. */
  function initOptions() {
    initErrorMonitoring()
    return sentry.init.mock.calls[0][0]
  }

  it("redacts an error event before it is sent", () => {
    const event = {
      ...eventWithType("TypeError"),
      request: { url: `https://trovebox.io/reset-password#token=${JWT}` },
    }

    const sent = initOptions().beforeSend(event, {})

    expect(sent.request.url).toBe(
      "https://trovebox.io/reset-password#token=[REDACTED]"
    )
  })

  it("still drops suppressed noise outright", () => {
    expect(initOptions().beforeSend(eventWithType("AbortError"), {})).toBeNull()
  })

  it("redacts a transaction, which never passes through beforeSend", () => {
    const transaction = {
      type: "transaction",
      request: { url: "https://trovebox.io/verify-email?token=abc123" },
    }

    const sent = initOptions().beforeSendTransaction(transaction, {})

    expect(sent.request.url).toBe(
      "https://trovebox.io/verify-email?token=[REDACTED]"
    )
  })
})

describe("setErrorMonitoringUser", () => {
  beforeEach(() => {
    sentry.setUser.mockClear()
  })

  it("identifies the user by id alone", () => {
    setErrorMonitoringUser({ id: "u-1" })

    expect(sentry.setUser).toHaveBeenCalledWith({ id: "u-1" })
  })

  it("clears the user on logout", () => {
    setErrorMonitoringUser(null)

    expect(sentry.setUser).toHaveBeenCalledWith(null)
  })
})
