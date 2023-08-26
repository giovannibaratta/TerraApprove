import {
  Configuration,
  RequireApprovalItem
} from "@libs/domain/configuration/configuration"
import {ApprovalAction} from "@libs/domain/terraform/approval"
import {
  IConfigurationReader,
  ReadConfigurationError
} from "@libs/service/configuration/configuration-reader"
import {Injectable, Logger} from "@nestjs/common"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {either} from "fp-ts"
import {Either, chainW} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import {readFile, yamlToJson} from "../shared/file"

@Injectable()
export class FileConfigurationReader implements IConfigurationReader {
  readConfiguration(
    location: string
  ): Either<ReadConfigurationError, Configuration> {
    const configuration = pipe(
      either.right(location),
      chainW(readFile),
      chainW(yamlToJson),
      chainW(json => this.validateConfiguration(json)),
      chainW(externalModel => this.mapToConfiguration(externalModel))
    )

    return configuration
  }

  private validateConfiguration(
    unsafeConfiguration: unknown
  ): Either<"invalid_configuration", ConfigurationYamlModel> {
    const configurationValidator: ValidateFunction<ConfigurationYamlModel> =
      new Ajv({
        allErrors: true,
        removeAdditional: true
      }).compile(configurationSchema)

    if (configurationValidator(unsafeConfiguration)) {
      return either.right(unsafeConfiguration)
    }

    Logger.debug(JSON.stringify(configurationValidator.errors))

    return either.left("invalid_configuration")
  }

  private mapToConfiguration(
    externalModel: ConfigurationYamlModel
  ): Either<"invalid_configuration", Configuration> {
    if (externalModel.requireApproval === undefined)
      return either.right({requireApprovalItems: []})

    const requireApprovalItems = new Map<String, RequireApprovalItem>()

    for (const item of externalModel.requireApproval) {
      const existingItem = requireApprovalItems.get(item.fullyQualifiedAddress)

      if (existingItem) {
        Logger.error(
          `Duplicate fullyQualifiedAddress detected: ${item.fullyQualifiedAddress}`
        )
        return either.left("invalid_configuration")
      }

      requireApprovalItems.set(item.fullyQualifiedAddress, {
        fullQualifiedAddress: item.fullyQualifiedAddress,
        matchActions: item.actions
      })
    }

    return either.right({
      requireApprovalItems: Array.from(requireApprovalItems.values())
    })
  }
}

const configurationSchema: JSONSchemaType<ConfigurationYamlModel> = {
  type: "object",
  // Remove additional props from the object to be validated
  additionalProperties: false,
  required: [],
  properties: {
    requireApproval: {
      nullable: true,
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["fullyQualifiedAddress", "actions"],
        properties: {
          fullyQualifiedAddress: {
            type: "string"
          },
          actions: {
            type: "array",
            minItems: 1,
            uniqueItems: true,
            items: {
              type: "string",
              enum: Object.values(ApprovalAction)
            }
          }
        }
      }
    }
  }
}

interface ConfigurationYamlModel {
  requireApproval?: {
    fullyQualifiedAddress: string
    actions: ApprovalAction[]
  }[]
}
