import {Injectable, Logger} from "@nestjs/common"
import {CodebaseReaderService} from "../codebase-reader/codebase-reader.service"
import {chainW, isLeft} from "fp-ts/lib/Either"
import {
  TerraformEntity,
  findTerraformEntitiesInFile,
  printTerraformEntity
} from "@libs/domain/terraform/resource"
import {PlanReaderService} from "../plan-reader/plan-reader.service"
import {pipe} from "fp-ts/lib/function"
import {either} from "fp-ts"
import {
  DiffType,
  TerraformDiff,
  TerraformDiffMap,
  printTerraformDiff
} from "@libs/domain/terraform/diffs"
import {ApprovalAction} from "@libs/domain/terraform/approval"

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
        const resources: TerraformEntity[] = []

        for (const file of files) {
          const eitherResourcesInFile = findTerraformEntitiesInFile(file)

          if (isLeft(eitherResourcesInFile)) {
            return eitherResourcesInFile
          }

          resources.push(...eitherResourcesInFile.right)
        }

        return either.right(resources)
      })
    )

    if (isLeft(eitherTerraformResources)) {
      Logger.error(
        `Error while reading code base: ${eitherTerraformResources.left}`
      )
      throw new Error(eitherTerraformResources.left)
    }

    const terraformResources = eitherTerraformResources.right

    this.logCodeBaseSuccessfullyRead(terraformResources)

    const eitherTerraformDiffs = await this.planReaderService.readPlan(planFile)

    if (isLeft(eitherTerraformDiffs)) {
      Logger.error(`Error while reading plan: ${eitherTerraformDiffs.left}`)
      throw new Error(eitherTerraformDiffs.left)
    }

    const terraformDiffs = eitherTerraformDiffs.right

    this.logTerraformPlanSuccessfullyRead(terraformDiffs)

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

  private logCodeBaseSuccessfullyRead(terraformResources: TerraformEntity[]) {
    Logger.log(
      `Code base successfully read. Found ${terraformResources.length} resource(s).`
    )
    terraformResources.forEach(it =>
      Logger.debug(`- ${printTerraformEntity(it)}`)
    )
  }

  private logTerraformPlanSuccessfullyRead(terraformDiffs: TerraformDiffMap) {
    Logger.log(
      `Plan successfully parsed. Found ${
        Object.keys(terraformDiffs).length
      } diff(s).`
    )
    Object.values(terraformDiffs).forEach(it =>
      Logger.debug(`- ${printTerraformDiff(it)}`)
    )
  }
}
