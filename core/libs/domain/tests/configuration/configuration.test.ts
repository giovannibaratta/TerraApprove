import {
  RequireApprovalItem,
  requireApprovalItemToTerraformEntity
} from "@libs/domain/configuration/configuration"

describe("requireApprovalItemToTerraformEntity", () => {
  it("should return a TerraformEntity with the correct internal type when the address is a module", () => {
    // Given
    const requireApprovalItem: RequireApprovalItem = {
      fullQualifiedAddress: "module.my_module",
      matchActions: []
    }

    // When
    const result = requireApprovalItemToTerraformEntity(requireApprovalItem)

    // Expect
    expect(result).toEqual({
      entityInfo: {
        internalType: "module",
        userProvidedName: "my_module"
      },
      requireApproval: {
        type: "manual_approval",
        matchActions: []
      }
    })
  })

  it("should return a TerraformEntity with the correct internal type when the address is a plain resource", () => {
    // Given
    const requireApprovalItem: RequireApprovalItem = {
      fullQualifiedAddress: "aws_s3_bucket.my_bucket",
      matchActions: []
    }

    // When
    const result = requireApprovalItemToTerraformEntity(requireApprovalItem)

    // Expect
    expect(result).toEqual({
      entityInfo: {
        internalType: "plain_resource",
        providerType: "aws_s3_bucket",
        userProvidedName: "my_bucket"
      },
      requireApproval: {
        type: "manual_approval",
        matchActions: []
      }
    })
  })
})
