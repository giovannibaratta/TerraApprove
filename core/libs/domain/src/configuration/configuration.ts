import {ApprovalAction} from "../terraform/approval"
import {TerraformEntity} from "../terraform/resource"

export interface Configuration {
  readonly requireApprovalItems: RequireApprovalItem[]
}

export interface RequireApprovalItem {
  readonly fullQualifiedAddress: string
  readonly matchActions: ReadonlyArray<ApprovalAction>
}

export function requireApprovalItemToTerraformEntity(
  requireApprovalItem: RequireApprovalItem
): TerraformEntity {
  const splitAddress = requireApprovalItem.fullQualifiedAddress.split(".")
  // The address should be in the format "module.<module_name>.<...>" or "<provider_type>.<resource_name>"
  // based on where the resource is defined
  if (splitAddress.length < 2) throw new Error("Invalid resource address")

  const matchActions = requireApprovalItem.matchActions

  if (splitAddress[0] === "module") {
    return {
      entityInfo: {
        internalType: "module",
        userProvidedName: splitAddress[1]
      },
      decorator: {
        type: "manual_approval",
        matchActions
      }
    }
  }

  return {
    entityInfo: {
      internalType: "plain_resource",
      providerType: splitAddress[0],
      userProvidedName: splitAddress[1]
    },
    decorator: {
      type: "manual_approval",
      matchActions
    }
  }
}
