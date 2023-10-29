import * as ResourceFunctions from "@libs/domain/terraform/resource"
import {BootstrappingService} from "@libs/service/bootstrapping/bootstrapping.service"
import {CodebaseReaderService} from "@libs/service/codebase-reader/codebase-reader.service"
import {ConfigurationService} from "@libs/service/configuration/configuration.service"
import {PlanReaderService} from "@libs/service/plan-reader/plan-reader.service"
import {Logger} from "@nestjs/common"
import {Test, TestingModule} from "@nestjs/testing"
import {either} from "fp-ts"
import {CodebaseReaderServiceMock} from "../mocks/codebase-reader.service.mock"
import {ConfigurationServiceMock} from "../mocks/configuration.service.mock"
import {PlanReaderServiceMock} from "../mocks/plan-reader.service.mock"
import {mockConfiguration} from "@libs/testing/mocks/configuration.mock"
import {Action} from "@libs/domain/terraform/diffs"

describe("BootstrappingService", () => {
  let bootstrappingService: BootstrappingService
  let configurationService: ConfigurationService
  let planReaderService: PlanReaderService
  let codebaseReaderService: CodebaseReaderService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrappingService,
        {
          provide: ConfigurationService,
          useClass: ConfigurationServiceMock
        },
        {
          provide: PlanReaderService,
          useClass: PlanReaderServiceMock
        },
        {
          provide: CodebaseReaderService,
          useClass: CodebaseReaderServiceMock
        }
      ]
    }).compile()

    bootstrappingService = module.get(BootstrappingService)
    configurationService = module.get(ConfigurationService)
    planReaderService = module.get(PlanReaderService)
    codebaseReaderService = module.get(CodebaseReaderService)
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(Logger, "error").mockImplementation()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe("bootstrap", () => {
    beforeEach(() => {
      // Happy path
      bootstrappingService.setConfigurationLocation("configuration/location")
      bootstrappingService.setTerraformCodeBaseLocation("codebase/location")
      bootstrappingService.setTerraformPlanLocation("plan/location")
    })

    it(
      "should throw an error if the resource of type plain resource is defined both " +
        "in the code base and in the configuration",
      async () => {
        // Given
        jest
          .spyOn(planReaderService, "readPlan")
          .mockResolvedValue(either.right({}))
        jest
          .spyOn(codebaseReaderService, "getTerraformFilesInFolder")
          .mockReturnValue(
            either.right([
              // we need at least one file to be returned
              {
                name: "resource.tf",
                lines: []
              }
            ])
          )

        const providerType = "aws_s3_bucket"
        const userProvidedName = "my_bucket"

        jest
          .spyOn(ResourceFunctions, "findTerraformEntitiesInFile")
          .mockReturnValue(
            either.right([
              {
                entityInfo: {
                  internalType: "plain_resource",
                  providerType,
                  userProvidedName
                },
                decorator: {type: "manual_approval"}
              }
            ])
          )

        jest.spyOn(configurationService, "readConfiguration").mockReturnValue(
          mockConfiguration({
            requireApprovalItems: [
              {
                fullQualifiedAddress: `${providerType}.${userProvidedName}`,
                matchActions: [Action.CREATE]
              }
            ]
          })
        )

        // When
        await expect(bootstrappingService.bootstrap()).rejects.toThrow(
          `Duplicate entity found: plain_resource.${providerType}.${userProvidedName}`
        )
      }
    )

    it(
      "should throw an error if the resource of type plain module is defined both " +
        "in the code base and in the configuration",
      async () => {
        // Given
        jest
          .spyOn(planReaderService, "readPlan")
          .mockResolvedValue(either.right({}))
        jest
          .spyOn(codebaseReaderService, "getTerraformFilesInFolder")
          .mockReturnValue(
            either.right([
              // we need at least one file to be returned
              {
                name: "resource.tf",
                lines: []
              }
            ])
          )

        const moduleName = "my_module"

        jest
          .spyOn(ResourceFunctions, "findTerraformEntitiesInFile")
          .mockReturnValue(
            either.right([
              {
                entityInfo: {
                  internalType: "module",
                  userProvidedName: moduleName
                },
                decorator: {type: "manual_approval"}
              }
            ])
          )

        jest.spyOn(configurationService, "readConfiguration").mockReturnValue(
          mockConfiguration({
            requireApprovalItems: [
              {
                fullQualifiedAddress: `module.${moduleName}.something.else`,
                matchActions: [Action.CREATE]
              }
            ]
          })
        )

        // When
        await expect(bootstrappingService.bootstrap()).rejects.toThrow(
          `Duplicate entity found: module.${moduleName}`
        )
      }
    )
  })
})
