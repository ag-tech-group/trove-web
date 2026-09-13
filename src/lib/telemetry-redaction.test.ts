import { describe, expect, it } from "vitest"
import { redactString, redactTelemetry } from "./telemetry-redaction"

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1LTEifQ.c2lnbmF0dXJl"

describe("redactString", () => {
  it("redacts a token in the fragment and keeps the page", () => {
    expect(
      redactString(`https://trovebox.io/reset-password#token=${JWT}`)
    ).toBe("https://trovebox.io/reset-password#token=[REDACTED]")
  })

  it("redacts a token in the query string and keeps the other parameters", () => {
    expect(
      redactString(
        "https://trovebox.io/verify-email?token=abc123&next=%2Fitems"
      )
    ).toBe("https://trovebox.io/verify-email?token=[REDACTED]&next=%2Fitems")
  })

  it("redacts any parameter whose name ends in token", () => {
    expect(redactString("/callback?access_token=abc&state=xyz")).toBe(
      "/callback?access_token=[REDACTED]&state=xyz"
    )
  })

  it("redacts a JWT wherever it appears", () => {
    expect(redactString(`request failed: ${JWT} was rejected`)).toBe(
      "request failed: [REDACTED] was rejected"
    )
  })

  it("redacts an email address", () => {
    expect(redactString("could not reach someone@example.com")).toBe(
      "could not reach [REDACTED]"
    )
  })

  it("leaves an ordinary URL untouched", () => {
    const url = "https://trovebox.io/items/123?page=2#photos"

    expect(redactString(url)).toBe(url)
  })
})

describe("redactTelemetry", () => {
  it("redacts strings at any depth, in objects and arrays alike", () => {
    const event = {
      request: { url: "https://trovebox.io/reset-password#token=abc" },
      breadcrumbs: [{ data: { to: "/verify-email?token=def" } }],
    }

    expect(redactTelemetry(event)).toEqual({
      request: { url: "https://trovebox.io/reset-password#token=[REDACTED]" },
      breadcrumbs: [{ data: { to: "/verify-email?token=[REDACTED]" } }],
    })
  })

  it("redacts object keys, because some payloads are keyed by URL", () => {
    const payload = { "https://trovebox.io/reset-password#token=abc": [1, 2] }

    expect(redactTelemetry(payload)).toEqual({
      "https://trovebox.io/reset-password#token=[REDACTED]": [1, 2],
    })
  })

  it("leaves numbers, booleans, null and non-plain objects as they are", () => {
    const timestamp = new Date(0)

    const result = redactTelemetry({
      count: 3,
      ok: true,
      none: null,
      timestamp,
    })

    expect(result).toEqual({ count: 3, ok: true, none: null, timestamp })
    expect(result.timestamp).toBe(timestamp)
  })

  it("returns a copy rather than changing what it was given", () => {
    const event = { message: "someone@example.com" }

    redactTelemetry(event)

    expect(event.message).toBe("someone@example.com")
  })
})
