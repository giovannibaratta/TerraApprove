import {Configuration} from "@libs/domain/configuration/configuration"
import {
  DiffType,
  TerraformDiff,
  mapDiffTypeToActions
} from "@libs/domain/terraform/diffs"
import {
  TerraformEntity,
  isDiffActionIncludedInEntityDecorator,
  printShortTerraformEntity
} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"

@Injectable()
export class RequireApprovalModeUseCase {
  isApprovalRequired(data: {
    configuration: Configuration
    diffsEntityPairs: [TerraformDiff, TerraformEntity][]
  }): boolean {
    const {diffsEntityPairs, configuration} = data

    // From all the diffs, keep only the ones that requires approval
    const resourcesThatRequiredApproval = diffsEntityPairs.filter(pair =>
      this.doesDiffRequireApproval(configuration, pair[0], pair[1])
    )

    Logger.log(
      `Found ${resourcesThatRequiredApproval.length} resource(s) that require approval:`
    )
    resourcesThatRequiredApproval.forEach(it =>
      Logger.log(`- ${printShortTerraformEntity(it[1])}`)
    )

    return resourcesThatRequiredApproval.length > 0
  }

  private doesDiffRequireApproval(
    configuration: Configuration,
    diff: TerraformDiff,
    entity: TerraformEntity
  ): boolean {
    return (
      this.doesDiffMatchGlobalConfigurationMatchers(configuration, diff) ||
      // Verify first if one of the action to achieve the diffType is in the list of actions that
      // always require approval. If this is the case the resource requires approval.
      this.doesContainActionThatAlwaysRequireApproval(
        configuration,
        diff.diffType
      ) ||
      // If no match is found check is there is a specific decorator associated to the resource.
      (entity.decorator.type === "manual_approval" &&
        isDiffActionIncludedInEntityDecorator(entity.decorator, diff))
    )
  }

  /**
   * Check if at least one of the global matchers matches the Terraform diff.
   */
  private doesDiffMatchGlobalConfigurationMatchers(
    configuration: Configuration,
    diff: TerraformDiff
  ): boolean {
    if (configuration.global.requireApprovalItems === undefined) return false

    const diffTypeToActions = mapDiffTypeToActions(diff.diffType)

    // One matcher is enough to consider the Terraform diff as matched.
    return configuration.global.requireApprovalItems.some(
      matcher =>
        // The conditions of the matcher are in logical AND.
        matcher.providerType === diff.providerType &&
        // If no actions is specified, it means that all actions are automatically matched.
        (matcher.actions === undefined ||
          // If at least one action is specified, we have to check if Terraform wants to perform
          // one of them.
          matcher.actions.some(action => diffTypeToActions.includes(action)))
    )
  }

  private doesContainActionThatAlwaysRequireApproval(
    configuration: Configuration,
    diffType: DiffType
  ): boolean {
    const actionaThatAlwaysRequireApproval =
      configuration.global.requireApprovalActions
    const actions = mapDiffTypeToActions(diffType)

    return (
      actionaThatAlwaysRequireApproval !== undefined &&
      actions.some(it => actionaThatAlwaysRequireApproval.includes(it))
    )
  }
}
