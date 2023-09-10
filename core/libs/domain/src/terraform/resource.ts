import {Logger} from "@nestjs/common"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {either, option} from "fp-ts"
import {Either, isLeft} from "fp-ts/lib/Either"
import {Option, isSome} from "fp-ts/lib/Option"
import {jsonrepair} from "jsonrepair"
import {File} from "../file/file"
import {
  ApprovalAction,
  DecoratorType,
  ManualApproval,
  NoDecorator,
  SafeToApply
} from "./approval"

export interface TerraformEntity {
  readonly entityInfo: TerraformEntityType
  readonly decorator: DecoratorType
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
// Exclude resources that are commented out
const resourceRegex = /^ *resource +"([^"]+)" +"([^"]+)" +{/

// Regex that matches the pattern module "module name" {
// Exclude modules that are commented out
const moduleRegex = /^ *module +"([^"]+)" +{/

// This function finds the supported terraform resources (e.g. resource, module) defined in a file
// and returns them as an array
export function findTerraformEntitiesInFile(
  file: File
): Either<"invalid_definition", TerraformEntity[]> {
  const {lines} = file
  const entities: TerraformEntity[] = []
  // Used to optimize the search of the approval tag. Instead of performing
  // the search on the whole file, we perform it on the lines between the
  // last found entity and the current one.
  let lastFoundEntity = 0

  for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex++) {
    const terraformEntityType = detectTerraformEntity(lines[lineIndex])

    if (option.isSome(terraformEntityType)) {
      const eitherDecorator: Either<"invalid_definition", DecoratorType> =
        // If the first line of the file contains a terraform resource, it means that it can't require approval
        lineIndex > 0
          ? extractDecorator(lines.slice(lastFoundEntity, lineIndex))
          : either.right({type: "no_decorator"})

      if (isLeft(eitherDecorator)) {
        Logger.error(
          `Invalid approval tag in file ${file.name} for resource on line ${lineIndex}}`
        )
        return eitherDecorator
      }

      entities.push({
        entityInfo: terraformEntityType.value,
        decorator: eitherDecorator.right
      })

      lastFoundEntity = lineIndex
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

// Generate a regex that matches the pattern # @<specified tag>(<options>)
// The decorator must be defined inside a comment otherwise
// it will not be terraform compliant. The options are not validated
// by this regex, but they are extracted as a group.
const decoratorRegexGenerator = (tag: string) =>
  new RegExp("^# *@" + tag + "\\((.*)\\) *$")

const requireApprovalRegex = decoratorRegexGenerator("RequireApproval")
const safeToApplyRegex = decoratorRegexGenerator("SafeToApply")

// Regex that matches the pattern <everything expect a comment>}<whatever>
// This regex is used to find the closing bracket of a resource definition.
const closingBracketRegex = /^[^#]+}.*$/

/**
 * Perform a reversed search in the previous line to find the approval tag.
 * The search stops when
 * - a line that is not a comment and a closing bracket is found. This is based on the
 *   assumption that no valid terraform code can be placed between the closing bracket
 *   and the resource definition but the assumption has not been verified.
 * - the approval tag is found
 * @param lines previous lines. The order of the lines should preserve the
 * original order
 */
export function extractDecorator(
  lines: string[]
): Either<"invalid_definition", DecoratorType> {
  // Scan all the lines in reverse order and search for ending bracket or approval tag
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex--) {
    const line = lines[lineIndex]

    // If the first match that we find is a closing bracket, it means that no approval
    // tag was defined between the previous resource and the current one
    if (closingBracketRegex.test(line)) {
      return either.right({type: "no_decorator"})
    }

    const eitherOptionalMatch = matchSupportedDecorator(line)

    if (isLeft(eitherOptionalMatch)) {
      // There is a validation error
      return eitherOptionalMatch
    }

    if (isSome(eitherOptionalMatch.right)) {
      // A supported tag has been found
      return either.right(eitherOptionalMatch.right.value)
    }
  }

  // No matches have been found. The tag is not defined
  return either.right({type: "no_decorator"})
}

function matchSupportedDecorator(
  line: string
): Either<"invalid_definition", Option<Exclude<DecoratorType, NoDecorator>>> {
  let matches: RegExpMatchArray | null = line.match(requireApprovalRegex)

  if (matches) {
    const optionalOptions = getOptionalParamsFromDecorator(
      matches[1].trim(),
      manualApprovalSchema
    )

    if (isLeft(optionalOptions)) {
      return optionalOptions
    }

    return either.right(
      option.some({
        type: "manual_approval",
        ...(isSome(optionalOptions.right) && optionalOptions.right.value)
      })
    )
  }

  matches = line.match(safeToApplyRegex)

  if (matches) {
    const optionalOptions = getOptionalParamsFromDecorator(
      matches[1].trim(),
      safeToApplySchema
    )

    if (isLeft(optionalOptions)) {
      return optionalOptions
    }

    return either.right(
      option.some({
        type: "safe_to_apply",
        ...(isSome(optionalOptions.right) && optionalOptions.right.value)
      })
    )
  }

  return either.right(option.none)
}

function getOptionalParamsFromDecorator<T extends DecoratorType>(
  rawOptionalParams: string,
  schema: JSONSchemaType<Omit<T, "type">>
): Either<"invalid_definition", Option<Omit<T, "type">>> {
  if (rawOptionalParams !== "") {
    let options

    try {
      // User jsonrepair to allow the user to use a lightweight syntax
      // for setting the options
      options = JSON.parse(jsonrepair(rawOptionalParams))
    } catch (e) {
      return either.left("invalid_definition")
    }

    // Validate that the options schema is valid
    const decoratorOptionsValidator: ValidateFunction<Omit<T, "type">> =
      new Ajv({
        allErrors: true
      }).compile(schema)

    const isValid = decoratorOptionsValidator(options)
    if (!isValid) {
      return either.left("invalid_definition")
    }

    return either.right(option.some(options))
  }

  return either.right(option.none)
}

export function printTerraformEntity(entity: TerraformEntity): string {
  return `${JSON.stringify({
    ...entity.entityInfo,
    decorator: entity.decorator
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

const safeToApplySchema: JSONSchemaType<Omit<SafeToApply, "type">> = {
  type: "object",
  additionalProperties: false,
  properties: {}
}
