import type { ValuationRead } from "@/api/generated/types"

export function formatMoney(value: string | number): string {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Newest first; partial ISO dates sort as text, undated ones last. */
export function sortValuations(valuations: ValuationRead[]): ValuationRead[] {
  return [...valuations].sort((a, b) => {
    if ((a.valued_on ?? "") !== (b.valued_on ?? "")) {
      if (!a.valued_on) return 1
      if (!b.valued_on) return -1
      return b.valued_on.localeCompare(a.valued_on)
    }
    return b.created_at.localeCompare(a.created_at)
  })
}
