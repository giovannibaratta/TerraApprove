import {
  Configuration,
  RequireApprovalItem,
  ResourceIdentifier
} from "@libs/domain/configuration/configuration"
import {
  IConfigurationReader,
  ReadConfigurationError
} from "@libs/service/configuration/configuration-reader"
import {Injectable, Logger} from "@nestjs/common"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {either} from "fp-ts"
import {Either, chainW, isLeft} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import {readFile, yamlToJson} from "../shared/file"
import {Action} from "@libs/domain/terraform/diffs"

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
    const eitherRequireApprovalItems = this.extractRequireApprovalItems(
      externalModel.requireApproval
    )

    if (isLeft(eitherRequireApprovalItems)) return eitherRequireApprovalItems

    const globalRequiredApprovalActions =
      externalModel.global?.requireApproval?.allResources?.actions

    const globalSafeToApplyActions =
      externalModel.global?.safeToApply?.allResources?.actions

    const globalRequiredApprovalProviderTypes:
      | ResourceIdentifier[]
      | undefined =
      externalModel.global?.requireApproval?.allResources?.matchers

    const globalSafeToApplyProviderTypes: ResourceIdentifier[] | undefined =
      externalModel.global?.safeToApply?.allResources?.matchers

    return either.right({
      requireApprovalItems: eitherRequireApprovalItems.right,
      global: {
        requireApprovalActions: globalRequiredApprovalActions,
        safeToApplyActions: globalSafeToApplyActions,
        requireApprovalItems: globalRequiredApprovalProviderTypes,
        safeToApplyItems: globalSafeToApplyProviderTypes
      }
    })
  }

  private extractRequireApprovalItems(
    items: ConfigurationYamlModel["requireApproval"]
  ): Either<"invalid_configuration", RequireApprovalItem[]> {
    if (items === undefined) return either.right([])

    const requireApprovalItems = new Map<String, RequireApprovalItem>()

    for (const item of items) {
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

    return either.right(Array.from(requireApprovalItems.values()))
  }
}

const configurationSchema: JSONSchemaType<ConfigurationYamlModel> = {
  type: "object",
  // Remove additional props from the object to be validated
  additionalProperties: false,
  required: [],
  properties: {
    global: {
      nullable: true,
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {
        requireApproval: {
          nullable: true,
          type: "object",
          additionalProperties: false,
          required: [],
          properties: {
            allResources: {
              nullable: true,
              type: "object",
              additionalProperties: false,
              required: [],
              properties: {
                actions: {
                  type: "array",
                  minItems: 0,
                  uniqueItems: true,
                  items: {
                    type: "string",
                    enum: Object.values(Action)
                  }
                },
                matchers: {
                  type: "array",
                  minItems: 1,
                  uniqueItems: true,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["providerType"],
                    properties: {
                      providerType: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        safeToApply: {
          nullable: true,
          type: "object",
          additionalProperties: false,
          required: [],
          properties: {
            allResources: {
              nullable: true,
              type: "object",
              additionalProperties: false,
              required: [],
              properties: {
                actions: {
                  type: "array",
                  minItems: 1,
                  uniqueItems: true,
                  items: {
                    type: "string",
                    enum: Object.values(Action)
                  }
                },
                matchers: {
                  type: "array",
                  minItems: 1,
                  uniqueItems: true,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["providerType"],
                    properties: {
                      providerType: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
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
              enum: Object.values(Action)
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
    actions: Action[]
  }[]

  global?: {
    requireApproval?: {
      allResources?: {
        actions: Action[]
        matchers: ResourceMatcher[]
      }
    }

    safeToApply?: {
      allResources?: {
        actions: Action[]
        matchers: ResourceMatcher[]
      }
    }
  }
}

interface ResourceMatcher {
  providerType: string
}
