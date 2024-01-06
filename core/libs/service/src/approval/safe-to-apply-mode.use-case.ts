import {Configuration} from "@libs/domain/configuration/configuration"
import {getSafeToApplyActionsFromDecorator} from "@libs/domain/terraform/approval"
import {
  Action,
  TerraformDiff,
  mapDiffTypeToActions
} from "@libs/domain/terraform/diffs"
import {
  TerraformEntity,
  printShortTerraformEntity
} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"

@Injectable()
export class SafeToApplyModeUseCase {
  isApprovalRequired(data: {
    configuration: Configuration
    diffsEntityPairs: [TerraformDiff, TerraformEntity][]
  }): boolean {
    const {diffsEntityPairs, configuration} = data

    // From all the diffs, remove all the ones that are safe to apply
    const resourcesThatAreNotSafeToApply = diffsEntityPairs.filter(pair => {
      const terraformDiff = pair[0]
      const terraformEntity = pair[1]

      // Merge the safe to apply actions defined at the global level and the ones defined at the resource level
      const safeActionsForResource: Action[] = [
        ...(configuration.global.safeToApplyActions ?? []),
        ...getSafeToApplyActionsFromDecorator(terraformEntity.decorator)
      ]

      const isTypeSafeToApply = this.doesDiffMatchGlobalConfigurationMatchers(
        configuration,
        terraformDiff
      )

      return (
        // If type is in the safe-list, there is no need to check the actions
        !isTypeSafeToApply &&
        // It all the actions that will be perfomed to apply the plan are not included in the safe-list,
        // it means that there is a potential unsafe action for the resource and we need to ask for approval.
        !areAllItemsIncluded(
          safeActionsForResource,
          mapDiffTypeToActions(terraformDiff.diffType)
        )
      )
    })

    Logger.log(
      `Found ${resourcesThatAreNotSafeToApply.length} resource(s) that are not safe to apply:`
    )
    resourcesThatAreNotSafeToApply.forEach(it =>
      Logger.log(`- ${printShortTerraformEntity(it[1])}`)
    )

    return resourcesThatAreNotSafeToApply.length > 0
  }

  /**
   * Check if at least one of the global matchers matches the Terraform diff.
   */
  private doesDiffMatchGlobalConfigurationMatchers(
    configuration: Configuration,
    diff: TerraformDiff
  ): boolean {
    if (configuration.global.safeToApplyItems === undefined) return false

    const diffTypeToActions = mapDiffTypeToActions(diff.diffType)

    // One matcher is enough to consider the Terraform diff as matched.
    return configuration.global.safeToApplyItems.some(
      matcher =>
        // The conditions of the matcher are in logical AND.
        matcher.providerType === diff.providerType &&
        // If no actions is specified, it means that all actions are automatically matched.
        (matcher.actions === undefined ||
          // If at least one action is specified, in order to be considered safe we have to check
          // that all the actiosn that Terraform wants to perform are included in the matcher list.
          areAllItemsIncluded(matcher.actions, diffTypeToActions))
    )
  }
}

function areAllItemsIncluded<T>(
  items: ReadonlyArray<T>,
  itemsToCheck: ReadonlyArray<T>
): boolean {
  return itemsToCheck.every(it => items.includes(it))
}
