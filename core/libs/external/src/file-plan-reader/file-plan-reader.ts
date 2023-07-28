import {
  DiffType,
  TerraformDiff,
  TerraformDiffMap
} from "@libs/domain/terraform/diffs"
import {
  IPlanReader,
  ValidationError
} from "@libs/service/plan-reader/plan-reader"
import {Injectable, Logger} from "@nestjs/common"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {either} from "fp-ts"
import {Either, chainW} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import {readFileSync} from "fs"

@Injectable()
export class FilePlanReader implements IPlanReader {
  constructor() {}

  async readPlan(
    planLocation: string
  ): Promise<Either<ValidationError, TerraformDiffMap>> {
    const result = pipe(
      either.right(planLocation),
      chainW(this.readFile),
      chainW(this.validateFile),
      chainW(this.mapToTerraformDiffs)
    )

    return result
  }

  private readFile(planLocation: string): Either<"resource_not_found", string> {
    let fileContent: string

    try {
      fileContent = readFileSync(planLocation, "utf8")
    } catch (e) {
      return either.left("resource_not_found")
    }

    return either.right(fileContent)
  }

  private validateFile(
    fileContent: string
  ): Either<"invalid_resource", TerraformPlan> {
    const parsedFile = JSON.parse(fileContent)

    const terraformPlanValidator: ValidateFunction<TerraformPlan> = new Ajv({
      allErrors: true
    }).compile(terraformPlanSchema)

    const isValid = terraformPlanValidator(parsedFile)
    if (!isValid) {
      either.left("invalid_resource")
    }
    return either.right(parsedFile)
  }

  private mapToTerraformDiffs(
    plan: TerraformPlan
  ): Either<"invalid_content" | "ambiguous_diff", TerraformDiffMap> {
    let diffs: TerraformDiff[]

    try {
      diffs = plan.resource_changes
        // Exclude no-op and read diffs
        .filter(
          it =>
            !it.change.actions.includes("no-op") &&
            !it.change.actions.includes("read")
        )
        .map(resourceChange => {
          return {
            resourceType: resourceChange.type,
            name: resourceChange.name,
            diffType: mapActions(resourceChange.change.actions)
          }
        })
    } catch (e) {
      Logger.error(e)
      return either.left("invalid_content")
    }

    try {
      const result = diffs.reduce((acc, curr) => {
        const key = `${curr.resourceType}.${curr.name}`
        if (acc[key]) {
          // The combination of resource type and resource name shoudl be unique,
          // so we have an ambiguous diff
          throw new Error(`Ambiguous diff found for ${key}`)
        }
        acc[key] = curr
        return acc
      }, {} as TerraformDiffMap)

      return either.right(result)
    } catch (e) {
      Logger.error(e)
      return either.left("ambiguous_diff")
    }
  }
}

function mapActions(actions: Action[]): DiffType {
  if (actions.length > 2) {
    throw new Error("More than two actions are not supported")
  }

  if (actions.length === 2) {
    if (!actions.includes("create") || !actions.includes("delete")) {
      throw new Error("Only create and delete actions are supported together")
    }
    return "replace"
  }

  if (actions.length === 0) {
    throw new Error("No actions specified")
  }

  // Only one action is left at this point
  const action = actions[0]
  let diffType: DiffType

  switch (action) {
    case "create":
      diffType = "create"
      break
    case "update":
      diffType = "update"
      break
    case "delete":
      diffType = "delete"
      break
    case "read":
    case "no-op":
      throw new Error("No-op and read actions should be filtered out")
  }
  return diffType
}

interface TerraformPlan {
  resource_changes: ResourceChange[]
}

interface ResourceChange {
  type: string
  name: string
  change: Change
}

interface Change {
  actions: Action[]
}

type Action = "read" | "create" | "update" | "delete" | "no-op"

const terraformPlanSchema: JSONSchemaType<TerraformPlan> = {
  type: "object",
  additionalProperties: true,
  required: ["resource_changes"],
  properties: {
    resource_changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["type", "name", "change"],
        properties: {
          type: {
            type: "string"
          },
          name: {
            type: "string"
          },
          change: {
            type: "object",
            additionalProperties: true,
            required: ["actions"],
            properties: {
              actions: {
                type: "array",
                minItems: 1,
                items: {
                  type: "string",
                  enum: ["read", "create", "update", "delete", "no-op"]
                }
              }
            }
          }
        }
      }
    }
  }
}
