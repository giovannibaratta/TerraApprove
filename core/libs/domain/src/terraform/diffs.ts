export interface TerraformDiff {
  readonly resourceType: string
  readonly name: string
  readonly diffType: DiffType
}

export type TerraformResourceUniqueIdentifier = string

export type TerraformDiffMap = Record<
  TerraformResourceUniqueIdentifier,
  TerraformDiff
>

export type DiffType = "create" | "update" | "delete" | "replace"
