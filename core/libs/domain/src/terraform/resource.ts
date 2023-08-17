import {Option} from "fp-ts/lib/Option"
import {File} from "../file/file"
import {option} from "fp-ts"

export interface TerraformEntity {
  readonly file: string
  readonly entityInfo: TerraformEntityType
  readonly requireApproval: boolean
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
export function findTerraformEntitiesInFile(file: File): TerraformEntity[] {
  const {lines} = file
  const entities: TerraformEntity[] = []

  for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex++) {
    const terraformEntityType = detectTerraformEntity(lines[lineIndex])

    if (option.isSome(terraformEntityType)) {
      const requireApproval =
        // If the first line of the file contains a terraform resource, it means that it can't require approval
        lineIndex > 0 && doesLinesContainsApprovalTag(lines[lineIndex - 1])

      entities.push({
        file: file.name,
        entityInfo: terraformEntityType.value,
        requireApproval
      })
    }
  }

  return entities
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

// Regex that matches the pattern # @RequireApproval()
// The decorator must be defined inside a comment otherwise
// it will not be terraform compliant
const requireApprovalRegex = /^# *@RequireApproval\(\) *$/

function doesLinesContainsApprovalTag(line: string): boolean {
  return line.match(requireApprovalRegex) !== null
}

export function printTerraformEntity(entity: TerraformEntity): string {
  return `${entity.file}: ${JSON.stringify({
    ...entity.entityInfo,
    requireApproval: entity.requireApproval
  })}`
}
