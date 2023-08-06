import {ApprovalService} from "@libs/service/approval/approval.service"
import {TestingModule, Test} from "@nestjs/testing"
import {CodebaseReaderServiceMock} from "../mocks/codebase-reader.service.mock"
import {CodebaseReaderService} from "@libs/service/codebase-reader/codebase-reader.service"
import {PlanReaderService} from "@libs/service/plan-reader/plan-reader.service"
import {PlanReaderServiceMock} from "../mocks/plan-reader.service.mock"
import * as Resource from "@libs/domain/terraform/resource"
import {either} from "fp-ts"
import {File} from "@libs/domain/file/file"
import {TerraformDiff} from "@libs/domain/terraform/diffs"

describe("ApprovalService", () => {
  let approvalService: ApprovalService
  let codebaseReader: CodebaseReaderService
  let planReaderService: PlanReaderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: CodebaseReaderService,
          useClass: CodebaseReaderServiceMock
        },
        {
          provide: PlanReaderService,
          useClass: PlanReaderServiceMock
        }
      ]
    }).compile()

    approvalService = module.get(ApprovalService)
    codebaseReader = module.get(CodebaseReaderService)
    planReaderService = module.get(PlanReaderService)

    jest.restoreAllMocks()
  })

  describe("isApprovalRequired", () => {
    it("should return true if the plan contains a plain resource that requires approval", async () => {
      // Given
      const foundFiles: File[] = [
        {
          name: "main.tf",
          lines: ["something"]
        }
      ]

      const resourceType: string = "aws_s3_bucket"
      const resourceName: string = "my_bucket"
      const resourceAddress: string = "aws_s3_bucket.my_bucket"

      jest
        .spyOn(codebaseReader, "getTerraformFilesInFolder")
        .mockReturnValue(either.right(foundFiles))
      jest.spyOn(Resource, "findTerraformEntitiesInFile").mockReturnValue([
        {
          file: "main.tf",
          entityInfo: {
            internalType: "plain_resource",
            providerType: resourceType,
            userProvidedName: resourceName
          },
          requireApproval: true
        }
      ])

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const terraformDiffMap = {
        [resourceAddress]: diffFromPlan
      }

      jest
        .spyOn(planReaderService, "readPlan")
        .mockResolvedValue(either.right(terraformDiffMap))

      const tfCodeBaseDir = "terraformCodeBaseDir"
      const tfPlanPath = "terraformPlanPath"

      // When
      const result = await approvalService.isApprovalRequired(
        tfCodeBaseDir,
        tfPlanPath
      )

      // Expect
      expect(result).toBe(true)
      expect(codebaseReader.getTerraformFilesInFolder).toHaveBeenCalledWith(
        tfCodeBaseDir
      )
      expect(Resource.findTerraformEntitiesInFile).toHaveBeenCalledWith(
        foundFiles[0]
      )
      expect(planReaderService.readPlan).toHaveBeenCalledWith(tfPlanPath)
    })
  })
})
