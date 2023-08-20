import {Option} from "fp-ts/lib/Option"
import {File} from "../file/file"
import {either, option} from "fp-ts"
import {ApprovalAction, ApprovalType, ManualApproval} from "./approval"
import {Either, isLeft} from "fp-ts/lib/Either"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {Logger} from "@nestjs/common"
import {jsonrepair} from "jsonrepair"

export interface TerraformEntity {
  readonly file: string
  readonly entityInfo: TerraformEntityType
  readonly requireApproval: ApprovalType
}

type TerraformEntityType = TerraformPlainResource | TerraformModule

interface TerraformPlainResource {
  readonly internalType: "plain_resource"
  readonly providerType: string
  readonly userProvidedName: string
}

interface TerraformModule {
  readonly internalType: "module"
  readonly userProvidedName: string
}

// Regex that matches the pattern resource "resource type" "resource name" {
const resourceRegex = /resource +"([^"]+)" +"([^"]+)" +{/

// Regex that matches the pattern module "module name" {
const moduleRegex = /module +"([^"]+)" +{/

// This function finds the supported terraform resources (e.g. resource, module) defined in a file
// and returns them as an array
export function findTerraformEntitiesInFile(
  file: File
): Either<"invalid_definition", TerraformEntity[]> {
  const {lines} = file
  const entities: TerraformEntity[] = []

  for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex++) {
    const terraformEntityType = detectTerraformEntity(lines[lineIndex])

    if (option.isSome(terraformEntityType)) {
      const eitherApprovalType: Either<"invalid_definition", ApprovalType> =
        // If the first line of the file contains a terraform resource, it means that it can't require approval
        lineIndex > 0
          ? extractApprovalTag(lines[lineIndex - 1])
          : either.right({type: "no_approval"})

      if (isLeft(eitherApprovalType)) {
        Logger.error(
          `Invalid approval tag in file ${file.name} on line ${lineIndex - 1}}`
        )
        return eitherApprovalType
      }

      entities.push({
        file: file.name,
        entityInfo: terraformEntityType.value,
        requireApproval: eitherApprovalType.right
      })
    }
  }

  return either.right(entities)
}

function detectTerraformEntity(line: string): Option<TerraformEntityType> {
  const plainResourceMatch = line.match(resourceRegex)
  if (plainResourceMatch) {
    return option.some({
      internalType: "plain_resource",
      providerType: plainResourceMatch[1],
      userProvidedName: plainResourceMatch[2]
    })
  }

  const moduleMatch = line.match(moduleRegex)
  if (moduleMatch) {
    return option.some({
      internalType: "module",
      userProvidedName: moduleMatch[1]
    })
  }

  return option.none
}

// Regex that matches the pattern # @RequireApproval(<options>)
// The decorator must be defined inside a comment otherwise
// it will not be terraform compliant. The options is not validated
// by this regex, but it is extracted as a group.
const requireApprovalRegex = /^# *@RequireApproval\((.*)\) *$/

export function extractApprovalTag(
  line: string
): Either<"invalid_definition", ApprovalType> {
  const matches = line.match(requireApprovalRegex)

  if (!matches) {
    return either.right({type: "no_approval"})
  }

  const rawOptions = matches[1].trim()

  if (rawOptions !== "") {
    let options

    try {
      // User jsonrepair to allow the user to use a lightweight syntax for the options
      // for setting the options
      options = JSON.parse(jsonrepair(rawOptions))
    } catch (e) {
      return either.left("invalid_definition")
    }

    const manualApprovalOptionsValidator: ValidateFunction<
      Omit<ManualApproval, "type">
    > = new Ajv({
      allErrors: true
    }).compile(manualApprovalSchema)

    const isValid = manualApprovalOptionsValidator(options)
    if (!isValid) {
      return either.left("invalid_definition")
    }

    return either.right({
      type: "manual_approval",
      ...options
    })
  }

  return either.right({type: "manual_approval"})
}

export function printTerraformEntity(entity: TerraformEntity): string {
  return `${entity.file}: ${JSON.stringify({
    ...entity.entityInfo,
    requireApproval: entity.requireApproval
  })}`
}

const manualApprovalSchema: JSONSchemaType<Omit<ManualApproval, "type">> = {
  type: "object",
  additionalProperties: false,
  properties: {
    matchActions: {
      type: "array",
      nullable: true,
      minItems: 1,
      items: {
        type: "string",
        enum: Object.values(ApprovalAction)
      }
    }
  }
}
