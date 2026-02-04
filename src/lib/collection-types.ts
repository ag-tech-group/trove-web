import { useListCollectionTypesCollectionTypesGet } from "@/api/generated/hooks/collection-types/collection-types"

export interface FieldOption {
  value: string
  label: string
}

export interface TypeField {
  name: string
  label: string
  type: "string" | "enum"
  max_length?: number
  options?: FieldOption[]
}

export interface CollectionType {
  name: string
  label: string
  description: string
  fields: TypeField[]
}

/** Hook that returns the parsed collection type registry. */
export function useCollectionTypes() {
  const { data, isLoading } = useListCollectionTypesCollectionTypesGet()
  const types: CollectionType[] =
    (data?.data as CollectionType[] | undefined) ?? []
  return { types, isLoading }
}

/** Look up a single type definition by name. */
export function findCollectionType(
  types: CollectionType[],
  name: string | undefined
): CollectionType | undefined {
  if (!name) return undefined
  return types.find((t) => t.name === name)
}
