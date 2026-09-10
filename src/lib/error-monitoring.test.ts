import { describe, expect, it } from "vitest"
import type { ErrorEvent as SentryErrorEvent, EventHint } from "@sentry/react"
import { shouldSuppressEvent } from "./error-monitoring"

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
