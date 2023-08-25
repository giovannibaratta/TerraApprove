import {FileConfigurationReader} from "@libs/external/file-configuration-reader/file-configuration.reader"
import {Test} from "@nestjs/testing"
import * as FileFunction from "@libs/external/shared/file"
import {either} from "fp-ts"

describe("FileConfigurationReader", () => {
  let fileConfigurationReader: FileConfigurationReader

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FileConfigurationReader]
    }).compile()

    fileConfigurationReader = module.get(FileConfigurationReader)
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
    expect(result).toEqual(either.right({}))
  })
})
