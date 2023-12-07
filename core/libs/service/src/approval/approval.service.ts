import {TerraformDiff, TerraformDiffMap} from "@libs/domain/terraform/diffs"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"
import {BootstrappingService} from "../bootstrapping/bootstrapping.service"
import {RequireApprovalModeUseCase} from "./require-approval-mode.use-case"
import {SafeToApplyModeUseCase} from "./safe-to-apply-mode.use-case"

@Injectable()
export class ApprovalService {
  constructor(
    private readonly bootstrappingService: BootstrappingService,
    private readonly requireApprovalModeUseCase: RequireApprovalModeUseCase,
    private readonly safeToApplyModeUseCase: SafeToApplyModeUseCase
  ) {}

  async isApprovalRequired(params: IsApprovalRequiredParams): Promise<boolean> {
    const {terraformEntities, terraformDiffMap, configuration} =
      await this.bootstrappingService.bootstrap()

    const diffsEntityPairs = this.generateDiffEntityPairs(
      terraformDiffMap,
      terraformEntities
    )

    if (params.mode === "require_approval")
      return this.requireApprovalModeUseCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

    if (params.mode === "safe_to_apply")
      return this.safeToApplyModeUseCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

    throw new Error("Mode not supported")
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

export interface IsApprovalRequiredParams {
  mode: Mode
}

type Mode = "require_approval" | "safe_to_apply"
