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
      // Merge the safe to apply actions defined at the global level and the ones defined at the resource level
      const safeActionsForResource: Action[] = [
        ...(configuration.global.safeToApplyActions ?? []),
        ...getSafeToApplyActionsFromDecorator(pair[1].decorator)
      ]

      const isTypeSafeToApply =
        configuration.global.safeToApplyItems
          ?.map(it => it.providerType)
          .includes(pair[0].providerType) ?? false

      return (
        // If type is in the safe-list, there is no need to check the actions
        !isTypeSafeToApply &&
        // It all the actions that will be perfomed to apply the plan are not included in the safe-list,
        // it means that there is a potential unsafe action for the resource and we need to ask for approval.
        !areAllItemsIncluded(
          safeActionsForResource,
          mapDiffTypeToActions(pair[0].diffType)
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
}

function areAllItemsIncluded<T>(
  items: ReadonlyArray<T>,
  itemsToCheck: ReadonlyArray<T>
): boolean {
  return itemsToCheck.every(it => items.includes(it))
}
