/**
 * Dates known only as precisely as the owner knows them. The API stores them as
 * ISO text at that precision: "1998", "1998-06" or "1998-06-15".
 */

export interface PartialDateParts {
  year: string
  /** "" or "1"–"12" */
  month: string
  /** "" or "1"–"31" */
  day: string
}

const PARTIAL_DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

export function splitPartialDate(
  value: string | null | undefined
): PartialDateParts {
  const match = value ? PARTIAL_DATE.exec(value) : null
  if (!match) return { year: "", month: "", day: "" }
  return {
    year: match[1],
    month: match[2] ? String(Number(match[2])) : "",
    day: match[3] ? String(Number(match[3])) : "",
  }
}

/**
 * The ISO text for the parts: "" when they're all empty, or null when they
 * don't describe a real date (no year, a day without a month, 30 February).
 */
export function joinPartialDate({
  year,
  month,
  day,
}: PartialDateParts): string | null {
  if (!year && !month && !day) return ""
  if (!/^\d{4}$/.test(year) || Number(year) < 1) return null
  if (!month) return day ? null : year
  const monthNumber = Number(month)
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12)
    return null
  const mm = String(monthNumber).padStart(2, "0")
  if (!day) return `${year}-${mm}`
  const dayNumber = Number(day)
  if (
    !Number.isInteger(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > daysInMonth(Number(year), monthNumber)
  )
    return null
  return `${year}-${mm}-${String(dayNumber).padStart(2, "0")}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** "1998", "June 1998" or "June 15, 1998", in the reader's locale. */
export function formatPartialDate(
  value: string | null | undefined,
  locale?: string
): string {
  if (!value) return ""
  const match = PARTIAL_DATE.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  if (!month) return year
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, day ? Number(day) : 1)
  )
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    ...(day ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date)
}

/** Month names in the reader's locale, January first. */
export function monthNames(locale?: string): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  })
  return Array.from({ length: 12 }, (_, i) =>
    format.format(new Date(Date.UTC(2000, i, 1)))
  )
}
