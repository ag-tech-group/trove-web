import { describe, expect, it } from "vitest"
import type { ValuationRead } from "@/api/generated/types"
import { formatMoney, sortValuations } from "@/lib/valuations"

function valuation(
  id: string,
  valued_on: string | null,
  created_at = "2026-01-01T00:00:00Z"
): ValuationRead {
  return {
    id,
    item_id: "item-1",
    value: "100.00",
    valued_on,
    appraiser: null,
    valuation_type: null,
    notes: null,
    created_at,
    updated_at: created_at,
  }
}

describe("sortValuations", () => {
  it("puts the newest first, whatever precision each date has", () => {
    const sorted = sortValuations([
      valuation("a", "1998"),
      valuation("b", "2021-03"),
      valuation("c", null),
      valuation("d", "2021-03-15"),
    ])
    expect(sorted.map((v) => v.id)).toEqual(["d", "b", "a", "c"])
  })

  it("breaks ties by when they were recorded", () => {
    const sorted = sortValuations([
      valuation("older", "2020", "2026-01-01T00:00:00Z"),
      valuation("newer", "2020", "2026-02-01T00:00:00Z"),
    ])
    expect(sorted.map((v) => v.id)).toEqual(["newer", "older"])
  })
})

it("formats dollars with separators and cents", () => {
  expect(formatMoney("2200")).toMatch(/^\$2.200\.00$/)
  expect(formatMoney(12.5)).toBe("$12.50")
})
