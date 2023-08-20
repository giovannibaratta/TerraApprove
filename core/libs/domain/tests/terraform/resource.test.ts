import {
  extractApprovalTag,
  findTerraformEntitiesInFile
} from "@libs/domain/terraform/resource"
import {either} from "fp-ts"

describe("findTerraformEntitiesInFile", () => {
  it("should return an empty array when the file has no lines", () => {
    // Given
    const file = {
      name: "file",
      lines: []
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(either.right([]))
  })

  it("should correctly identify the plain resources defined in the file", () => {
    // Given
    const [type1, name1] = ["aws_s3_bucket", "bucket"]
    const [type2, name2] = ["google_bucket", "bucket2"]

    const file = {
      name: "file",
      lines: [
        `resource "${type1}" "${name1}" {`,
        "some random content that should be ignored",
        "}",
        `resource "${type2}" "${name2}" {`,
        "some random content that should be ignored",
        "}"
      ]
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(
      either.right([
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          requireApproval: {type: "no_approval"}
        },
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          requireApproval: {type: "no_approval"}
        }
      ])
    )
  })

  it("should correctly identify the plain resources that require approval", () => {
    // Given
    const [type1, name1] = ["aws_s3_bucket", "bucket"]
    const [type2, name2] = ["google_bucket", "bucket2"]

    const file = {
      name: "file",
      lines: [
        "some random content that should be ignored",
        `resource "${type1}" "${name1}" {`,
        "}",
        "#@RequireApproval()",
        `resource "${type2}" "${name2}" {`,
        "some random content that should be ignored",
        "}"
      ]
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(
      either.right([
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          requireApproval: {type: "no_approval"}
        },
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          requireApproval: {type: "manual_approval"}
        }
      ])
    )
  })

  it("should correctly identify the plain resources that require approval even if there are multiple spaces before and after the tag", () => {
    // Given
    const [type1, name1] = ["google_bucket", "bucket"]
    const [type2, name2] = ["google_bucket", "bucket2"]
    const [type3, name3] = ["google_bucket", "bucket3"]

    const file = {
      name: "file",
      lines: [
        "# @RequireApproval()",
        `resource "${type1}" "${name1}" {`,
        "}",
        "#@RequireApproval() ",
        `resource "${type2}" "${name2}" {`,
        "}",
        "#  @RequireApproval() ",
        `resource "${type3}" "${name3}" {`,
        "}"
      ]
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(
      either.right([
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          requireApproval: {type: "manual_approval"}
        },
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          requireApproval: {type: "manual_approval"}
        },
        {
          file: file.name,
          entityInfo: {
            internalType: "plain_resource",
            providerType: type3,
            userProvidedName: name3
          },
          requireApproval: {type: "manual_approval"}
        }
      ])
    )
  })
})

describe("extractApprovalTag", () => {
  it("should return an error when the options defined in the tag are not valid", () => {
    // Given
    const line = "# @RequireApproval(some_invalid_option)"

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return a no_approval object when the line does not contain the decorator", () => {
    // Given
    const line = "some random line"

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.right({type: "no_approval"}))
  })

  it("should return a manual_approval object when the line contains the decorator with no options", () => {
    // Given
    const line = "# @RequireApproval()"

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.right({type: "manual_approval"}))
  })

  it("should return a manual_approval object when the line contains the decorator with the manual option", () => {
    // Given
    const line =
      '# @RequireApproval({matchActions: ["CREATE", "UPDATE_IN_PLACE", "DELETE"]})'

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(
      either.right({
        type: "manual_approval",
        matchActions: ["CREATE", "UPDATE_IN_PLACE", "DELETE"]
      })
    )
  })

  it("should return an error if one of the actions defined in the manual_approval decorator is not valid", () => {
    // Given
    const line =
      '# @RequireApproval({matchActions: ["CREATE", "UPDATE_IN_PLACE", "INVALID_ACTION"]})'

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return an error if matchActions is not an array", () => {
    // Given
    const line = '# @RequireApproval({matchActions: "CREATE"})'

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return an error if matchActions is empty", () => {
    // Given
    const line = "# @RequireApproval({matchActions: []})"

    // When
    const result = extractApprovalTag(line)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })
})
