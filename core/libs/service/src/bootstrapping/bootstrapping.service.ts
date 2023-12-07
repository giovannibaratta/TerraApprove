import {
  Configuration,
  requireApprovalItemToTerraformEntity
} from "@libs/domain/configuration/configuration"
import {
  TerraformDiffMap,
  printTerraformDiff
} from "@libs/domain/terraform/diffs"
import {
  TerraformEntity,
  findTerraformEntitiesInFile,
  printTerraformEntity
} from "@libs/domain/terraform/resource"
import {Injectable, Logger} from "@nestjs/common"
import {either} from "fp-ts"
import {chainW, isLeft} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import {CodebaseReaderService} from "../codebase-reader/codebase-reader.service"
import {ConfigurationService} from "../configuration/configuration.service"
import {PlanReaderService} from "../plan-reader/plan-reader.service"

export type BootstapResult = {
  terraformDiffMap: TerraformDiffMap
  terraformEntities: TerraformEntity[]
  configuration: Configuration
}

@Injectable()
export class BootstrappingService {
  private terraformPlanLocation: string | undefined = undefined
  private terraformCodeBaseLocation: string | undefined = undefined
  private configurationLocation: string | undefined = undefined

  constructor(
    private readonly planReaderService: PlanReaderService,
    private readonly codebaseReader: CodebaseReaderService,
    private readonly configurationService: ConfigurationService
  ) {}

  setTerraformPlanLocation(location: string): void {
    if (location.trim() === "")
      throw new Error("Terraform plan location cannot be empty")

    this.terraformPlanLocation = location
  }

  setTerraformCodeBaseLocation(location: string): void {
    if (location.trim() === "")
      throw new Error("Terraform code base location cannot be empty")

    this.terraformCodeBaseLocation = location
  }

  setConfigurationLocation(location: string): void {
    if (location.trim() === "")
      throw new Error("Configuration location cannot be empty")

    this.configurationLocation = location
  }

  /** The function is responsible to read the resources in the codebase
   * and the diff from the plan. If the location of these resources have
   * not been set, an error is thrown.
   */
  async bootstrap(): Promise<BootstapResult> {
    const configuration = this.readConfiguration()
    const terraformDiffMap = await this.collectTerraformDiffMap()
    const terraformEntities = await this.collectTerraformEntities(configuration)
    return {terraformDiffMap, terraformEntities, configuration}
  }

  private async collectTerraformEntities(
    configuration: Configuration
  ): Promise<TerraformEntity[]> {
    const entitiesFromCodebase =
      await this.collectTerraformEntitiesFromCodeBase()

    const entitiesFromConfiguration =
      this.collectTerraformEntitiesFromConfiguration(configuration)

    this.throwIfConflictIsDetected(
      entitiesFromCodebase,
      entitiesFromConfiguration
    )

    // Merge taggegd entities collected from the code base
    // and entities collected from the configuration
    return [...entitiesFromCodebase, ...entitiesFromConfiguration]
  }

  private throwIfConflictIsDetected(
    entitiesFromCodebase: TerraformEntity[],
    entitiesFromConfiguration: TerraformEntity[]
  ) {
    const entitiesIdentifiers = new Set<string>()

    for (const entity of [
      ...entitiesFromCodebase,
      ...entitiesFromConfiguration
    ]) {
      let uniqueIdentifier: string

      switch (entity.entityInfo.internalType) {
        case "module":
          uniqueIdentifier = `${entity.entityInfo.internalType}.${entity.entityInfo.userProvidedName}`
          break
        case "plain_resource":
          uniqueIdentifier = `${entity.entityInfo.internalType}.${entity.entityInfo.providerType}.${entity.entityInfo.userProvidedName}`
          break
      }

      // Entities that have been extracted from the code base should never be duplicated
      // because Terraform requires to have unique identifiers. However resources
      // extracted from the configuration can reference a resource that has been
      // already tagged in the code base. If they specify the same set of actions for
      // which approval is needer, there is no issue but if they differ we have a conflict.
      // For now we assume that they are different and throw an error.
      if (entitiesIdentifiers.has(uniqueIdentifier)) {
        throw new Error(`Duplicate entity found: ${uniqueIdentifier}`)
      }

      entitiesIdentifiers.add(uniqueIdentifier)
    }
  }

  private readConfiguration(): Configuration {
    if (this.configurationLocation === undefined) {
      throw new Error("Configuration location not set")
    }

    return this.configurationService.readConfiguration(
      this.configurationLocation
    )
  }

  private collectTerraformEntitiesFromConfiguration(
    configuration: Configuration
  ): TerraformEntity[] {
    const entitiesFromConfiguration = configuration.requireApprovalItems

    return entitiesFromConfiguration.map(it =>
      requireApprovalItemToTerraformEntity(it)
    )
  }

  private async collectTerraformDiffMap(): Promise<TerraformDiffMap> {
    if (this.terraformPlanLocation === undefined) {
      throw new Error("Terraform plan location not set")
    }

    const eitherTerraformDiffs = await this.planReaderService.readPlan(
      this.terraformPlanLocation
    )

    if (isLeft(eitherTerraformDiffs)) {
      Logger.error(`Error while reading plan: ${eitherTerraformDiffs.left}`)
      throw new Error(eitherTerraformDiffs.left)
    }

    const terraformDiffs = eitherTerraformDiffs.right
    this.logTerraformPlanSuccessfullyRead(terraformDiffs)
    return terraformDiffs
  }

  private collectTerraformEntitiesFromCodeBase(): TerraformEntity[] {
    if (this.terraformCodeBaseLocation === undefined) {
      throw new Error("Terraform code base location not set")
    }

    const eitherTerraformResources = pipe(
      either.right(this.terraformCodeBaseLocation),
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
    return terraformResources
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
