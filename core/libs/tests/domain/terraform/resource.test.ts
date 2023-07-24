import {findTerraformResourcesInFile} from "domain/terraform/resource"

describe("findTerraformResourcesInFile", () => {
  it("should return an empty array when the file has no lines", () => {
    // Given
    const file = {
      name: "file",
      lines: []
    }

    // When
    const resources = findTerraformResourcesInFile(file)

    // Expect
    expect(resources).toEqual([])
  })

  it("should correctly identify the resources defined in the file", () => {
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
    const resources = findTerraformResourcesInFile(file)

    // Expect
    expect(resources).toEqual([
      {
        file: file.name,
        type: type1,
        name: name1,
        requireApproval: false
      },
      {
        file: file.name,
        type: type2,
        name: name2,
        requireApproval: false
      }
    ])
  })

  it("should correctly identify the resources that require approval", () => {
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
    const resources = findTerraformResourcesInFile(file)

    // Expect
    expect(resources).toEqual([
      {
        file: file.name,
        type: type1,
        name: name1,
        requireApproval: false
      },
      {
        file: file.name,
        type: type2,
        name: name2,
        requireApproval: true
      }
    ])
  })

  it("should correctly identify the resources that require approval even if there are multiple spaces before and after the tag", () => {
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
    const resources = findTerraformResourcesInFile(file)

    // Expect
    expect(resources).toEqual([
      {
        file: file.name,
        type: type1,
        name: name1,
        requireApproval: true
      },
      {
        file: file.name,
        type: type2,
        name: name2,
        requireApproval: true
      },
      {
        file: file.name,
        type: type3,
        name: name3,
        requireApproval: true
      }
    ])
  })
})
