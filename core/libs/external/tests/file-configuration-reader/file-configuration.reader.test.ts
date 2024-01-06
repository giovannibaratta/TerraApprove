import {Action} from "@libs/domain/terraform/diffs"
import {FileConfigurationReader} from "@libs/external/file-configuration-reader/file-configuration.reader"
import * as FileFunction from "@libs/external/shared/file"
import {expectRight} from "@libs/testing/expect-helpers"
import {Logger} from "@nestjs/common"
import {Test} from "@nestjs/testing"
import {either} from "fp-ts"

describe("FileConfigurationReader", () => {
  let fileConfigurationReader: FileConfigurationReader

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [FileConfigurationReader]
    }).compile()

    fileConfigurationReader = module.get(FileConfigurationReader)
  })

  beforeEach(() => {
    jest.spyOn(Logger, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should be defined", () => {
    expect(fileConfigurationReader).toBeDefined()
  })

  it("should return the configuration and ignore extra properties", () => {
    // Given
    const yamlToJsonContent = {
      a: "b"
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expect(result).not.toHaveProperty("a")
  })

  it("should return requireApprovalItems with one item", () => {
    // Given
    const resourceAddress = "aFullyQualifiedAddress"
    const actions = [Action.CREATE, Action.UPDATE_IN_PLACE]
    const yamlToJsonContent = {
      requireApproval: [
        {
          fullyQualifiedAddress: resourceAddress,
          actions: actions
        }
      ]
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(result.right).toMatchObject({
      requireApprovalItems: [
        {
          fullQualifiedAddress: resourceAddress,
          matchActions: actions
        }
      ]
    })
  })

  it("should return a global object containing required approval actions", () => {
    // Given
    const actions = [Action.CREATE, Action.UPDATE_IN_PLACE]
    const yamlToJsonContent = {
      global: {
        requireApproval: {
          allResources: {
            actions: actions
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(result.right).toMatchObject({
      global: {
        requireApprovalActions: actions
      }
    })
  })

  it("should return a global object containing safe to apply actions", () => {
    // Given
    const actions = [Action.CREATE, Action.UPDATE_IN_PLACE]
    const yamlToJsonContent = {
      global: {
        safeToApply: {
          allResources: {
            actions: actions
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(result.right).toMatchObject({
      global: {
        safeToApplyActions: actions
      }
    })
  })

  it("should return a global object containing required approval provider types", () => {
    // Given
    const providerTypes = ["aProviderType", "anotherProviderType"]
    const yamlToJsonContent = {
      global: {
        requireApproval: {
          allResources: {
            matchers: [
              {
                providerType: providerTypes[0]
              },
              {
                providerType: providerTypes[1]
              }
            ]
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(
      result.right.global.requireApprovalItems?.map(it => it.providerType)
    ).toBeArrayIncludingOnly(providerTypes)
  })

  it("should return a global object containing safe to apply provider types", () => {
    // Given
    const providerTypes = ["aProviderType", "anotherProviderType"]
    const yamlToJsonContent = {
      global: {
        safeToApply: {
          allResources: {
            matchers: [
              {
                providerType: providerTypes[0]
              },
              {
                providerType: providerTypes[1]
              }
            ]
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(
      result.right.global.safeToApplyItems?.map(it => it.providerType)
    ).toBeArrayIncludingOnly(providerTypes)
  })

  it("should return a global object containing safe to apply matcher with actions", () => {
    // Given
    const providerType = "aProviderType"
    const actions = [Action.CREATE, Action.UPDATE_IN_PLACE]
    const yamlToJsonContent = {
      global: {
        safeToApply: {
          allResources: {
            matchers: [
              {
                providerType: providerType,
                actions: actions
              }
            ]
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(result.right.global.safeToApplyItems).toHaveLength(1)

    expect(
      result.right.global.safeToApplyItems?.at(0)?.actions
    ).toBeArrayIncludingOnly(actions)
  })

  it("should return a global object containing require approval matcher with actions", () => {
    // Given
    const providerType = "aProviderType"
    const actions = [Action.CREATE, Action.UPDATE_IN_PLACE]
    const yamlToJsonContent = {
      global: {
        requireApproval: {
          allResources: {
            matchers: [
              {
                providerType: providerType,
                actions: actions
              }
            ]
          }
        }
      }
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expectRight(result)
    expect(result.right.global.requireApprovalItems).toHaveLength(1)

    expect(
      result.right.global.requireApprovalItems?.at(0)?.actions
    ).toBeArrayIncludingOnly(actions)
  })

  it("should return 'invalid_configuration' if the action is not valid", () => {
    // Given

    const yamlToJsonContent = {
      requireApproval: [
        {
          fullyQualifiedAddress: "aFullyQualifiedAddress",
          actions: ["invalidAction"]
        }
      ]
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expect(result).toEqual(either.left("invalid_configuration"))
  })

  it("should return 'invalid_configuration' if the fullyQualifiedAddress is duplicated", () => {
    // Given
    const resourceAddress = "aFullyQualifiedAddress"
    const yamlToJsonContent = {
      requireApproval: [
        {
          fullyQualifiedAddress: resourceAddress,
          actions: [Action.CREATE]
        },
        {
          fullyQualifiedAddress: resourceAddress,
          actions: [Action.UPDATE_IN_PLACE]
        }
      ]
    }

    jest
      .spyOn(FileFunction, "readFile")
      .mockReturnValueOnce(either.right("aContent"))

    jest
      .spyOn(FileFunction, "yamlToJson")
      .mockReturnValueOnce(either.right(yamlToJsonContent))

    // When
    const result = fileConfigurationReader.readConfiguration("aLocation")

    // Then
    expect(result).toEqual(either.left("invalid_configuration"))
  })
})
