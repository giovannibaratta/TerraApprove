export interface TerraformDiff {
  /** Fully qualified address of the resource. It contains the full path, including the modules and submodules */
  readonly fullyQualifiedAddress: string
  readonly providerType: string
  readonly userProvidedName: string
  readonly diffType: DiffType
  /** It's the user provided name of the module that contains the resource
   * that producede the diff. It's undefined if the resource is defined
   * in the root module. If the resource is defined in a nested module,
   * only the first level name will be caputred.
   */
  readonly firstLevelModule?: string
}

export type TerraformResourceUniqueIdentifier = string

export type TerraformDiffMap = Record<
  TerraformResourceUniqueIdentifier,
  TerraformDiff
>

export type DiffType = "create" | "update" | "delete" | "replace"

export enum Action {
  CREATE = "CREATE",
  UPDATE_IN_PLACE = "UPDATE_IN_PLACE",
  DELETE = "DELETE"
}

export function mapDiffTypeToActions(diffType: DiffType): Action[] {
  switch (diffType) {
    case "create":
      return [Action.CREATE]
    case "update":
      return [Action.UPDATE_IN_PLACE]
    case "delete":
      return [Action.DELETE]
    case "replace":
      return [Action.CREATE, Action.DELETE]
  }
}

export function printTerraformDiff(diff: TerraformDiff): string {
  return `${diff.fullyQualifiedAddress}: ${diff.diffType}`
}
