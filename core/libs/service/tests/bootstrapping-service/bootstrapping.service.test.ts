import {ApprovalAction} from "@libs/domain/terraform/approval"
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

    it("should throw an error if duplicate resources of type plain resource are found", async () => {
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
              requireApproval: {type: "manual_approval"}
            }
          ])
        )

      jest.spyOn(configurationService, "readConfiguration").mockReturnValue({
        requireApprovalItems: [
          {
            fullQualifiedAddress: `${providerType}.${userProvidedName}`,
            matchActions: [ApprovalAction.CREATE]
          }
        ]
      })

      // When
      await expect(bootstrappingService.bootstrap()).rejects.toThrow(
        `Duplicate entity found: plain_resource.${providerType}.${userProvidedName}`
      )
    })

    it("should throw an error if duplicate resources of type module are found", async () => {
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
              requireApproval: {type: "manual_approval"}
            }
          ])
        )

      jest.spyOn(configurationService, "readConfiguration").mockReturnValue({
        requireApprovalItems: [
          {
            fullQualifiedAddress: `module.${moduleName}.something.else`,
            matchActions: [ApprovalAction.CREATE]
          }
        ]
      })

      // When
      await expect(bootstrappingService.bootstrap()).rejects.toThrow(
        `Duplicate entity found: module.${moduleName}`
      )
    })
  })
})
