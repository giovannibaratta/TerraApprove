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
    const resourcesThatRequiredApproval = diffsEntityPairs.filter(
      pair =>
        // Check if the provider type is in the list of types that always require approval
        configuration.global.requireApprovalItems
          ?.map(it => it.providerType)
          .includes(pair[0].providerType) ||
        // Verify first if one of the action to achieve the diffType is in the list of actions that
        // always require approval. If this is the case the resource requires approval.
        this.doesContainActionThatAlwaysRequireApproval(
          configuration,
          pair[0].diffType
        ) ||
        // If no match is found check is there is a specific decorator associated to the resource.
        (pair[1].decorator.type === "manual_approval" &&
          isDiffActionIncludedInEntityDecorator(pair[1].decorator, pair[0]))
    )

    Logger.log(
      `Found ${resourcesThatRequiredApproval.length} resource(s) that require approval:`
    )
    resourcesThatRequiredApproval.forEach(it =>
      Logger.log(`- ${printShortTerraformEntity(it[1])}`)
    )

    return resourcesThatRequiredApproval.length > 0
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
