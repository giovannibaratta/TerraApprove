import {TerraformDiffMap} from "@libs/domain/terraform/diffs"
import {Either} from "fp-ts/lib/Either"

export interface IPlanReader {
  readPlan(
    planLocation: string
  ): Promise<Either<ValidationError, TerraformDiffMap>>
}

export type ValidationError =
  | "resource_not_found"
  | "invalid_resource"
  | "invalid_content"
  | "ambiguous_diff"

export const PLAN_READER = "PLAN_READER"
