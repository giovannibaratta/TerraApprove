import {Action} from "../terraform/diffs"
import {TerraformEntity} from "../terraform/resource"

export interface Configuration {
  readonly requireApprovalItems: RequireApprovalItem[]
  readonly global: GlobalConfiguration
}

export interface GlobalConfiguration {
  // List of actions that always require approval if they are found
  // in the plan.
  readonly requireApprovalActions?: ReadonlyArray<Action>
  // List of actions that are safe to apply if they are found in the
  // plan.
  readonly safeToApplyActions?: ReadonlyArray<Action>
  // List of resources that always require approval if they are found
  readonly requireApprovalItems?: ReadonlyArray<ResourceIdentifier>
  // List of resources that are safe to apply if they are found
  readonly safeToApplyItems?: ReadonlyArray<ResourceIdentifier>
}

export interface RequireApprovalItem {
  readonly fullQualifiedAddress: string
  readonly matchActions: ReadonlyArray<Action>
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

export interface ResourceIdentifier {
  // Name of the resource assgined by the provider (e.g. google_storage_bucket)
  readonly providerType: string
}
