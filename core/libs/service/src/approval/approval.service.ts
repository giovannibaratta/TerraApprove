import {Configuration} from "@libs/domain/configuration/configuration"
import {
  Action,
  DiffType,
  TerraformDiff,
  TerraformDiffMap,
  mapDiffTypeToActions
} from "@libs/domain/terraform/diffs"
import {
  TerraformEntity,
  isDiffActionIncludedInEntityDecorator,
  printShortTerraformEntity
} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"
import {BootstrappingService} from "../bootstrapping/bootstrapping.service"
import {getSafeToApplyActionsFromDecorator} from "@libs/domain/terraform/approval"

@Injectable()
export class ApprovalService {
  constructor(private readonly bootstrappingService: BootstrappingService) {}

  async isApprovalRequired(params: IsApprovalRequiredParams): Promise<boolean> {
    if (params.mode === "require_approval") return this.requireApprovalMode()
    if (params.mode === "safe_to_apply") return this.safeToApplyMode()

    throw new Error("Mode not supported")
  }

  private async requireApprovalMode(): Promise<boolean> {
    const {terraformEntities, terraformDiffMap, configuration} =
      await this.bootstrappingService.bootstrap()

    const diffsEntityPairs = this.generateDiffEntityPairs(
      terraformDiffMap,
      terraformEntities
    )

    // From all the diffs, keep only the ones that requires approval
    const resourcesThatRequiredApproval = diffsEntityPairs.filter(
      pair =>
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

  private generateDiffEntityPairs(
    terraformDiffMap: TerraformDiffMap,
    terraformEntities: TerraformEntity[]
  ) {
    return Object.keys(terraformDiffMap).reduce<
      [TerraformDiff, TerraformEntity][]
    >((acc, diffKey) => {
      const counterpart = this.findDiffCounterpartInEntities(
        terraformDiffMap[diffKey],
        terraformEntities
      )

      if (counterpart) {
        acc.push([terraformDiffMap[diffKey], counterpart])
        return acc
      }

      if (terraformDiffMap[diffKey].diffType !== "delete") {
        Logger.log(`Could not find counterpart for diff ${diffKey}`)
        throw new Error(
          `Could not find counterpart for diff ${diffKey}. The plan might be for the wrong code base.`
        )
      }

      // For now we will not cover the scenario where the deleted resources are from the
      // wrong code base. In the future it might be better adapt this error handling.
      return acc
    }, [])
  }

  private async safeToApplyMode(): Promise<boolean> {
    const {terraformEntities, terraformDiffMap, configuration} =
      await this.bootstrappingService.bootstrap()

    const diffsEntityPairs = this.generateDiffEntityPairs(
      terraformDiffMap,
      terraformEntities
    )

    // From all the diffs, remove all the ones that are safe to apply
    const resourcesThatAreNotSafeToApply = diffsEntityPairs.filter(pair => {
      // Merge the safe to apply actions defined at the global level and the ones defined at the resource level
      const safeActionsForResource: Action[] = [
        ...(configuration.global.safeToApplyActions ?? []),
        ...getSafeToApplyActionsFromDecorator(pair[1].decorator)
      ]

      // It all the actions that will be perfomed to apply the plan are not included in the safe-list,
      // it means that there is a potential unsafe action for the resource and we need to ask for approval.
      return !areAllItemsIncluded(
        safeActionsForResource,
        mapDiffTypeToActions(pair[0].diffType)
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

  private findDiffCounterpartInEntities(
    diff: TerraformDiff,
    entities: TerraformEntity[]
  ): TerraformEntity | undefined {
    // If it is a diff in the root module, we need to check that the name and type match
    const plainResourceMatch = (diff: TerraformDiff, entity: TerraformEntity) =>
      diff.firstLevelModule === undefined &&
      entity.entityInfo.internalType === "plain_resource" &&
      entity.entityInfo.userProvidedName === diff.userProvidedName &&
      entity.entityInfo.providerType === diff.providerType

    // If the diff is defined in a sub module, we limit the check to the module name
    const moduleEntityMatch = (diff: TerraformDiff, entity: TerraformEntity) =>
      diff.firstLevelModule !== undefined &&
      entity.entityInfo.internalType === "module" &&
      entity.entityInfo.userProvidedName === diff.firstLevelModule

    return entities.find(
      entity =>
        plainResourceMatch(diff, entity) || moduleEntityMatch(diff, entity)
    )
  }
}

function areAllItemsIncluded<T>(
  items: ReadonlyArray<T>,
  itemsToCheck: ReadonlyArray<T>
): boolean {
  return itemsToCheck.every(it => items.includes(it))
}

export interface IsApprovalRequiredParams {
  mode: Mode
}

type Mode = "require_approval" | "safe_to_apply"
