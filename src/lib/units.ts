/**
 * Measurements are stored metric (centimetres, kilograms). A user who prefers
 * imperial sees and types inches and pounds; these convert both ways.
 */

import type { UnitSystem } from "@/api/generated/types"

export type Units = UnitSystem

const CM_PER_INCH = 2.54
const KG_PER_POUND = 0.45359237

const FRACTION_GLYPHS: Record<string, string> = {
  "1/2": "½",
  "1/4": "¼",
  "3/4": "¾",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
}
const GLYPH_FRACTIONS = Object.fromEntries(
  Object.entries(FRACTION_GLYPHS).map(([text, glyph]) => [glyph, text])
)

export class MeasurementError extends Error {}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

/** A number with at most `places` decimals and no trailing zeros. */
function trim(value: number, places = 2): string {
  return String(Number(value.toFixed(places)))
}

/** Inches to the nearest sixteenth: 3.5 -> [3, "1/2"], 12 -> [12, ""]. */
function inchParts(inches: number): [number, string] {
  const sixteenths = Math.round(inches * 16)
  const whole = Math.floor(sixteenths / 16)
  let numerator = sixteenths % 16
  if (numerator === 0) return [whole, ""]
  let denominator = 16
  while (numerator % 2 === 0) {
    numerator /= 2
    denominator /= 2
  }
  return [whole, `${numerator}/${denominator}`]
}

/** "38.1 cm", or "15 in", "3½ in", "2 1/16 in". */
export function formatLength(
  cm: string | number | null | undefined,
  units: Units
): string {
  const value = toNumber(cm)
  if (value === null) return ""
  if (units === "metric") return `${trim(value)} cm`
  const [whole, fraction] = inchParts(value / CM_PER_INCH)
  if (!fraction) return `${whole} in`
  const glyph = FRACTION_GLYPHS[fraction]
  if (glyph) return `${whole || ""}${glyph} in`
  return `${whole ? `${whole} ` : ""}${fraction} in`
}

/** What an edit field starts with: "38.1", or "3 1/2" in inches. */
export function lengthInputValue(
  cm: string | number | null | undefined,
  units: Units
): string {
  const value = toNumber(cm)
  if (value === null) return ""
  if (units === "metric") return trim(value)
  const [whole, fraction] = inchParts(value / CM_PER_INCH)
  if (!fraction) return String(whole)
  return whole ? `${whole} ${fraction}` : fraction
}

const MEASURE =
  /^(?:(\d+(?:\.\d+)?)(?:\s*-\s*|\s+)?)?(?:(\d+)\s*\/\s*(\d+))?\s*([a-z"″']*)\.?$/i

/** The amount and unit someone typed: "3 1/2", "3-1/2", "3½", "10 cm", "2.5". */
function readAmount(input: string): [number, string] | null {
  const text = input
    .trim()
    .replace(/[½¼¾⅛⅜⅝⅞]/g, (glyph) => ` ${GLYPH_FRACTIONS[glyph]}`)
    .replace(",", ".")
    .trim()
  const match = MEASURE.exec(text)
  if (!match || (!match[1] && !match[2])) return null
  let amount = Number(match[1] ?? 0)
  if (match[2]) {
    if (Number(match[3]) === 0) return null
    amount += Number(match[2]) / Number(match[3])
  }
  return [amount, match[4].toLowerCase()]
}

const LENGTH_UNITS: Record<string, number> = {
  cm: 1,
  mm: 0.1,
  m: 100,
  in: CM_PER_INCH,
  inch: CM_PER_INCH,
  inches: CM_PER_INCH,
  '"': CM_PER_INCH,
  "″": CM_PER_INCH,
}

/**
 * Centimetres from what was typed, in the user's units unless the text names
 * one ("10 cm" while in inches). Null for an empty field; throws for text that
 * isn't a measurement.
 */
export function parseLength(input: string, units: Units): number | null {
  if (!input.trim()) return null
  const read = readAmount(input)
  const unit = read && (read[1] || (units === "metric" ? "cm" : "in"))
  const factor = unit ? LENGTH_UNITS[unit] : undefined
  if (!read || factor === undefined)
    throw new MeasurementError(
      units === "metric"
        ? "Enter a length in centimetres, like 12.5"
        : "Enter a length in inches, like 3 1/2"
    )
  return Number((read[0] * factor).toFixed(2))
}

/** "1.2 kg", or "2.65 lb", and ounces below a pound: "8.8 oz". */
export function formatWeight(
  kg: string | number | null | undefined,
  units: Units
): string {
  const value = toNumber(kg)
  if (value === null) return ""
  if (units === "metric") return `${trim(value, 3)} kg`
  const pounds = value / KG_PER_POUND
  return pounds < 1 ? `${trim(pounds * 16, 1)} oz` : `${trim(pounds)} lb`
}

/** What an edit field starts with: kilograms, or pounds. */
export function weightInputValue(
  kg: string | number | null | undefined,
  units: Units
): string {
  const value = toNumber(kg)
  if (value === null) return ""
  return units === "metric" ? trim(value, 3) : trim(value / KG_PER_POUND)
}

const WEIGHT_UNITS: Record<string, number> = {
  kg: 1,
  g: 0.001,
  lb: KG_PER_POUND,
  lbs: KG_PER_POUND,
  oz: KG_PER_POUND / 16,
}

/** Kilograms from what was typed, like `parseLength`. */
export function parseWeight(input: string, units: Units): number | null {
  if (!input.trim()) return null
  const read = readAmount(input)
  const unit = read && (read[1] || (units === "metric" ? "kg" : "lb"))
  const factor = unit ? WEIGHT_UNITS[unit] : undefined
  if (!read || factor === undefined)
    throw new MeasurementError(
      units === "metric"
        ? "Enter a weight in kilograms, like 1.5"
        : "Enter a weight in pounds, like 2.5"
    )
  return Number((read[0] * factor).toFixed(3))
}
