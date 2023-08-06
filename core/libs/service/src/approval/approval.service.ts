import {Injectable} from "@nestjs/common"
import {CodebaseReaderService} from "../codebase-reader/codebase-reader.service"
import {chainW, isLeft} from "fp-ts/lib/Either"
import {
  TerraformEntity,
  findTerraformEntitiesInFile
} from "@libs/domain/terraform/resource"
import {PlanReaderService} from "../plan-reader/plan-reader.service"
import {pipe} from "fp-ts/lib/function"
import {either} from "fp-ts"
import {TerraformDiff} from "@libs/domain/terraform/diffs"

@Injectable()
export class ApprovalService {
  constructor(
    private readonly codebaseReader: CodebaseReaderService,
    private readonly planReaderService: PlanReaderService
  ) {}

  async isApprovalRequired(
    codeBaseDir: string,
    planFile: string
  ): Promise<boolean> {
    const eitherTerraformResources = pipe(
      either.right(codeBaseDir),
      // Get all the terraform files in the folder
      chainW(dir => this.codebaseReader.getTerraformFilesInFolder(dir)),
      // Extract the terraform resource for each file in the folder
      chainW(files => {
        return either.right(
          files.map(file => findTerraformEntitiesInFile(file)).flat()
        )
      })
    )

    if (isLeft(eitherTerraformResources)) {
      throw new Error(eitherTerraformResources.left)
    }

    const eitherTerraformDiffs = await this.planReaderService.readPlan(planFile)

    if (isLeft(eitherTerraformDiffs)) {
      throw new Error(eitherTerraformDiffs.left)
    }

    const terraformResources = eitherTerraformResources.right
    const terraformDiffs = eitherTerraformDiffs.right

    return Object.keys(terraformDiffs).some(key =>
      this.doesRequiredApproval(terraformDiffs[key], terraformResources)
    )
  }

  private doesRequiredApproval(
    diff: TerraformDiff,
    entities: TerraformEntity[]
  ): boolean {
    const resource = this.findDiffCounterpartInEntities(diff, entities)

    if (resource === undefined) {
      throw new Error(
        `Could not find resource ${diff.userProvidedName} of type ${diff.providerType}`
      )
    }

    return resource.requireApproval
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
