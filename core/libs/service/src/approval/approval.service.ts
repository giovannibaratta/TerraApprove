import {ApprovalAction} from "@libs/domain/terraform/approval"
import {DiffType, TerraformDiff} from "@libs/domain/terraform/diffs"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"
import {BootstrappingService} from "../bootstrapping/bootstrapping.service"

@Injectable()
export class ApprovalService {
  constructor(private readonly bootstrappingService: BootstrappingService) {}

  async isApprovalRequired(): Promise<boolean> {
    const {terraformEntities, terraformDiffMap} =
      await this.bootstrappingService.bootstrap()

    // From all the diffs, keep only the ones that requires approval
    const resourcesThatRequiredApproval = Object.keys(terraformDiffMap).filter(
      key => this.doesRequiredApproval(terraformDiffMap[key], terraformEntities)
    )

    Logger.log(
      `Found ${resourcesThatRequiredApproval.length} resource(s) that require approval:`
    )
    resourcesThatRequiredApproval.forEach(it => Logger.log(`- ${it}`))

    return resourcesThatRequiredApproval.length > 0
  }

  private doesRequiredApproval(
    diff: TerraformDiff,
    entities: TerraformEntity[]
  ): boolean {
    const resource = this.findDiffCounterpartInEntities(diff, entities)

    if (resource === undefined) {
      // The resource might not be available in the code base for several reason:
      // - (legit) the resource has been deleted
      // - (non legit) the diff has not been generated from the specified code base
      // For now we will not cover the non legit scenarios, but in the future it might
      // be better to add some error handling here.
      return false
    }

    if (resource.requireApproval.type === "no_approval") return false

    const matchingActions = resource.requireApproval.matchActions

    return (
      // If no actions are speficied, we assume that all actions require approval
      matchingActions === undefined ||
      this.mapDiffTypeToApprovalActions(diff.diffType).some(it =>
        matchingActions.includes(it)
      )
    )
  }

  private mapDiffTypeToApprovalActions(diffType: DiffType): ApprovalAction[] {
    switch (diffType) {
      case "create":
        return [ApprovalAction.CREATE]
      case "update":
        return [ApprovalAction.UPDATE_IN_PLACE]
      case "delete":
        return [ApprovalAction.DELETE]
      case "replace":
        return [ApprovalAction.DELETE, ApprovalAction.CREATE]
    }
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
