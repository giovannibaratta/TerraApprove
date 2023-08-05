import {findTerraformEntitiesInFile} from "@libs/domain/terraform/resource"

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
    expect(resources).toEqual([])
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
    expect(resources).toEqual([
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type1,
          userProvidedName: name1
        },
        requireApproval: false
      },
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type2,
          userProvidedName: name2
        },
        requireApproval: false
      }
    ])
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
    expect(resources).toEqual([
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type1,
          userProvidedName: name1
        },
        requireApproval: false
      },
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type2,
          userProvidedName: name2
        },
        requireApproval: true
      }
    ])
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
    expect(resources).toEqual([
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type1,
          userProvidedName: name1
        },
        requireApproval: true
      },
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type2,
          userProvidedName: name2
        },
        requireApproval: true
      },
      {
        file: file.name,
        entityInfo: {
          internalType: "plain_resource",
          providerType: type3,
          userProvidedName: name3
        },
        requireApproval: true
      }
    ])
  })
})
