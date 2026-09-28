import { describe, expect, it } from "vitest"
import {
  formatPartialDate,
  joinPartialDate,
  monthNames,
  splitPartialDate,
} from "@/lib/partial-date"

describe("formatPartialDate", () => {
  it.each([
    ["1998", "1998"],
    ["1998-06", "June 1998"],
    ["1998-06-15", "June 15, 1998"],
    ["", ""],
    [null, ""],
    ["circa 1998", "circa 1998"],
  ])("shows %s as %s", (value, expected) => {
    expect(formatPartialDate(value, "en-US")).toBe(expected)
  })
})

describe("splitPartialDate and joinPartialDate", () => {
  it.each(["1998", "1998-06", "1998-06-15", "2024-02-29"])(
    "round-trips %s",
    (value) => {
      expect(joinPartialDate(splitPartialDate(value))).toBe(value)
    }
  )

  it("splits into the parts a form edits", () => {
    expect(splitPartialDate("1998-06-05")).toEqual({
      year: "1998",
      month: "6",
      day: "5",
    })
    expect(splitPartialDate(null)).toEqual({ year: "", month: "", day: "" })
  })

  it("joins nothing into an empty date", () => {
    expect(joinPartialDate({ year: "", month: "", day: "" })).toBe("")
  })

  it.each([
    [{ year: "98", month: "", day: "" }],
    [{ year: "", month: "6", day: "" }],
    [{ year: "1998", month: "", day: "15" }],
    [{ year: "1998", month: "2", day: "30" }],
    [{ year: "2023", month: "2", day: "29" }],
    [{ year: "1998", month: "13", day: "" }],
  ])("refuses what isn't a real date: %o", (parts) => {
    expect(joinPartialDate(parts)).toBeNull()
  })
})

it("names the months in order", () => {
  expect(monthNames("en-US")[0]).toBe("January")
  expect(monthNames("en-US")).toHaveLength(12)
})
