import {
  extractDecorator,
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
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          decorator: {type: "no_decorator"}
        },
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          decorator: {type: "no_decorator"}
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
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          decorator: {type: "no_decorator"}
        },
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          decorator: {type: "manual_approval"}
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
          entityInfo: {
            internalType: "plain_resource",
            providerType: type1,
            userProvidedName: name1
          },
          decorator: {type: "manual_approval"}
        },
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: type2,
            userProvidedName: name2
          },
          decorator: {type: "manual_approval"}
        },
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: type3,
            userProvidedName: name3
          },
          decorator: {type: "manual_approval"}
        }
      ])
    )
  })

  it("should ignore plain resources that are commented", () => {
    // Given
    const file = {
      name: "file",
      lines: [
        ' # resource "something" "else" {',
        "}",
        '# resource "something" "else" {',
        "}",
        '#resource "something" "else" {',
        "}",
        '### resource "something" "else" {',
        "}",
        '/* resource "something" "else" {',
        "}"
      ]
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(either.right([]))
  })

  it("should ignore modules that are commented", () => {
    // Given
    const file = {
      name: "file",
      lines: [
        ' # module "something" {',
        "}",
        '# module "something" {',
        "}",
        '#module "something" {',
        "}",
        '### module "something" {',
        "}",
        '/* module "something" {',
        "}"
      ]
    }

    // When
    const resources = findTerraformEntitiesInFile(file)

    // Expect
    expect(resources).toEqual(either.right([]))
  })
})

describe("extractDecorator", () => {
  it("should return an error when the options defined in the tag are not valid", () => {
    // Given
    const lines = ["# @RequireApproval(some_invalid_option)"]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return a no_decorator object when the lines do not contain the decorator", () => {
    // Given
    const lines = ["some random line", "", "   ", "#", "####"]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.right({type: "no_decorator"}))
  })

  it("should return no_decorator object if the decorator is defined before the closing bracket", () => {
    // Given
    const lines = [
      "# @RequireApproval()",
      "  } # some comment",
      "# more comments",
      "  "
    ]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.right({type: "no_decorator"}))
  })

  it("should detect the RequireApproval decorator if it is defined after the closing bracket", () => {
    // Given
    const lines = [
      "  } # some comment",
      "# more comments",
      "  ",
      "# @RequireApproval()"
    ]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(
      either.right({
        type: "manual_approval"
      })
    )
  })

  it("should return a manual_approval object when the line contains the RequireApproval decorator with no options", () => {
    // Given
    const lines = ["# @RequireApproval()"]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.right({type: "manual_approval"}))
  })

  it("should return a manual_approval object when the line contains the RequireApproval decorator with the manual option", () => {
    // Given
    const lines = [
      '# @RequireApproval({matchActions: ["CREATE", "UPDATE_IN_PLACE", "DELETE"]})'
    ]

    // When
    const result = extractDecorator(lines)

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
    const lines = [
      '# @RequireApproval({matchActions: ["CREATE", "UPDATE_IN_PLACE", "INVALID_ACTION"]})'
    ]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return an error if matchActions is not an array", () => {
    // Given
    const lines = ['# @RequireApproval({matchActions: "CREATE"})']

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should return an error if matchActions is empty", () => {
    // Given
    const lines = ["# @RequireApproval({matchActions: []})"]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(either.left("invalid_definition"))
  })

  it("should detect the SafeToApply decorator if it is defined after the closing bracket", () => {
    // Given
    const lines = [
      "  } # some comment",
      "# more comments",
      "  ",
      "# @SafeToApply()"
    ]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(
      either.right({
        type: "safe_to_apply"
      })
    )
  })

  it("should return a SafeToApply decorator and populate the matchActions property", () => {
    // Given
    const lines = [
      '# @SafeToApply({matchActions: ["CREATE", "UPDATE_IN_PLACE", "DELETE"]})'
    ]

    // When
    const result = extractDecorator(lines)

    // Expect
    expect(result).toEqual(
      either.right({
        type: "safe_to_apply",
        matchActions: ["CREATE", "UPDATE_IN_PLACE", "DELETE"]
      })
    )
  })
})
