import { describe, expect, it } from "vitest"
import {
  formatLength,
  formatWeight,
  lengthInputValue,
  MeasurementError,
  parseLength,
  parseWeight,
  weightInputValue,
} from "@/lib/units"

describe("lengths", () => {
  it.each([
    ["38.10", "metric", "38.1 cm"],
    ["38.10", "imperial", "15 in"],
    ["8.89", "imperial", "3½ in"],
    ["1.27", "imperial", "½ in"],
    ["5.24", "imperial", "2 1/16 in"],
    [null, "imperial", ""],
  ] as const)("shows %s cm as %s → %s", (cm, units, expected) => {
    expect(formatLength(cm, units)).toBe(expected)
  })

  it.each([
    ["3 1/2", 8.89],
    ["3-1/2", 8.89],
    ["3½", 8.89],
    ['3.5"', 8.89],
    ["1/2 in", 1.27],
    ["10 cm", 10],
  ])("reads %s typed in inches as %s cm", (input, cm) => {
    expect(parseLength(input, "imperial")).toBe(cm)
  })

  it("reads centimetres by default in metric", () => {
    expect(parseLength("12,5", "metric")).toBe(12.5)
    expect(parseLength("2 in", "metric")).toBe(5.08)
  })

  it("treats an empty field as no value", () => {
    expect(parseLength("  ", "imperial")).toBeNull()
  })

  it.each(["twelve", "12 hands", "3/0", "12 x 4"])("refuses %s", (input) => {
    expect(() => parseLength(input, "imperial")).toThrow(MeasurementError)
  })

  it.each(["8.89", "38.10", "5.24", "0.95"])(
    "survives a round trip through inches: %s cm",
    (cm) => {
      const typed = lengthInputValue(cm, "imperial")
      const saved = parseLength(typed, "imperial")
      expect(lengthInputValue(saved, "imperial")).toBe(typed)
    }
  )
})

describe("weights", () => {
  it.each([
    ["1.200", "metric", "1.2 kg"],
    ["1.200", "imperial", "2.65 lb"],
    ["0.250", "imperial", "8.8 oz"],
  ] as const)("shows %s kg as %s → %s", (kg, units, expected) => {
    expect(formatWeight(kg, units)).toBe(expected)
  })

  it("reads pounds and ounces into kilograms", () => {
    expect(parseWeight("2.65", "imperial")).toBe(1.202)
    expect(parseWeight("8 oz", "imperial")).toBe(0.227)
    expect(parseWeight("1.5", "metric")).toBe(1.5)
  })

  it("edits in the user's units", () => {
    expect(weightInputValue("1.200", "imperial")).toBe("2.65")
    expect(weightInputValue("1.200", "metric")).toBe("1.2")
  })
})
