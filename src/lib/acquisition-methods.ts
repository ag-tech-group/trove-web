import type { AcquisitionMethod } from "@/api/generated/types"

export const ACQUISITION_METHODS: {
  value: AcquisitionMethod
  label: string
}[] = [
  { value: "purchase", label: "Purchase" },
  { value: "gift", label: "Gift" },
  { value: "inheritance", label: "Inheritance" },
  { value: "trade", label: "Trade" },
  { value: "commission", label: "Commission" },
  { value: "other", label: "Other" },
]
