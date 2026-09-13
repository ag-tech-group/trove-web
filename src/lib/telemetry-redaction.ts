/**
 * Redacts what must never leave the browser in error reports or analytics,
 * wherever it sits in the payload, object keys included.
 */

const REDACTED = "[REDACTED]"

/** A URL parameter whose name ends in "token", in the query or the fragment. */
const URL_TOKEN_PARAM = /([?#&;][\w-]*token=)[^&#\s"'<>]*/gi

/** A JWT: three base64url segments, the first an encoded `{"` header. */
const JWT = /\beyJ[\w-]*\.[\w-]+\.[\w-]+/g

/** An email address. Reports identify a user by id, never by address. */
const EMAIL_ADDRESS = /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi

export function redactString(text: string): string {
  return text
    .replace(URL_TOKEN_PARAM, `$1${REDACTED}`)
    .replace(JWT, REDACTED)
    .replace(EMAIL_ADDRESS, REDACTED)
}

/**
 * Returns a redacted copy of `value`. Only plain objects and arrays are walked;
 * anything else (a Date, a class instance) is returned as is.
 */
export function redactTelemetry<T>(value: T): T {
  return redact(value) as T
}

function redact(value: unknown): unknown {
  if (typeof value === "string") return redactString(value)
  if (Array.isArray(value)) return value.map(redact)
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        redactString(key),
        redact(item),
      ])
    )
  }
  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
