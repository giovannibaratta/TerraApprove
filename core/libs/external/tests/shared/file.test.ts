import {yamlToJson} from "@libs/external/shared/file"
import {either} from "fp-ts"

describe("yamlToJson", () => {
  it("should return an empty object if the content is empty", () => {
    // Given
    const content = ""

    // When
    const result = yamlToJson(content)

    // Then
    expect(result).toEqual(either.right({}))
  })

  it("should return invalid_resource error if the content is just a string", () => {
    // Given
    const content = "hello"

    // When
    const result = yamlToJson(content)

    // Then
    expect(result).toEqual(either.left("invalid_resource"))
  })
})
