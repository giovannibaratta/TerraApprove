import {Injectable, Logger} from "@nestjs/common"
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
      Logger.error(
        `Error while reading code base: ${eitherTerraformResources.left}`
      )
      throw new Error(eitherTerraformResources.left)
    }

    const terraformResources = eitherTerraformResources.right

    Logger.log(
      `Code base successfully read. Found ${terraformResources.length} resource(s).`
    )

    const eitherTerraformDiffs = await this.planReaderService.readPlan(planFile)

    if (isLeft(eitherTerraformDiffs)) {
      Logger.error(`Error while reading plan: ${eitherTerraformDiffs.left}`)
      throw new Error(eitherTerraformDiffs.left)
    }

    const terraformDiffs = eitherTerraformDiffs.right

    Logger.log(
      `Plan successfully parsed. Found ${
        Object.keys(terraformDiffs).length
      } diff(s).`
    )

    const resourcesThatRequiredApproval = Object.keys(terraformDiffs).filter(
      key => this.doesRequiredApproval(terraformDiffs[key], terraformResources)
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
