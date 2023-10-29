import {ApprovalAction} from "@libs/domain/terraform/approval"
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
    const actions = [ApprovalAction.CREATE, ApprovalAction.UPDATE_IN_PLACE]
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
    const actions = [ApprovalAction.CREATE, ApprovalAction.UPDATE_IN_PLACE]
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
          actions: [ApprovalAction.CREATE]
        },
        {
          fullyQualifiedAddress: resourceAddress,
          actions: [ApprovalAction.UPDATE_IN_PLACE]
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
