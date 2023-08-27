import {ApprovalAction} from "@libs/domain/terraform/approval"
import {TerraformDiff} from "@libs/domain/terraform/diffs"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {ApprovalService} from "@libs/service/approval/approval.service"
import {BootstrappingService} from "@libs/service/bootstrapping/bootstrapping.service"
import {Test, TestingModule} from "@nestjs/testing"
import {BootstrappingServiceMock} from "../mocks/bootstrapping.service.mock"

describe("ApprovalService", () => {
  let approvalService: ApprovalService
  let bootstrappingService: BootstrappingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: BootstrappingService,
          useClass: BootstrappingServiceMock
        }
      ]
    }).compile()

    approvalService = module.get(ApprovalService)
    bootstrappingService = module.get(BootstrappingService)

    jest.restoreAllMocks()
  })

  describe("isApprovalRequired", () => {
    it("should return true if the plan contains a plain resource that requires approval", async () => {
      // Given

      const resourceType: string = "aws_s3_bucket"
      const resourceName: string = "my_bucket"
      const resourceAddress: string = "aws_s3_bucket.my_bucket"

      const terraformEntities: TerraformEntity[] = [
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: resourceType,
            userProvidedName: resourceName
          },
          requireApproval: {type: "manual_approval"}
        }
      ]

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const terraformDiffMap = {
        [resourceAddress]: diffFromPlan
      }

      jest.spyOn(bootstrappingService, "bootstrap").mockResolvedValue({
        terraformDiffMap,
        terraformEntities
      })

      // When
      const result = await approvalService.isApprovalRequired()

      // Expect
      expect(result).toBe(true)
    })

    it("should return true if the plan contains a resource defined in a module that requires approval", async () => {
      // Given
      const moduleName = "my_module"

      const terraformEntities: TerraformEntity[] = [
        {
          entityInfo: {
            internalType: "module",
            userProvidedName: moduleName
          },
          requireApproval: {type: "manual_approval"}
        }
      ]

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: "fq_address",
        userProvidedName: "my_bucket",
        providerType: "aws_s3_bucket",
        diffType: "create",
        firstLevelModule: moduleName
      }

      const terraformDiffMap = {
        [diffFromPlan.fullyQualifiedAddress]: diffFromPlan
      }

      jest.spyOn(bootstrappingService, "bootstrap").mockResolvedValue({
        terraformDiffMap,
        terraformEntities
      })

      // When
      const result = await approvalService.isApprovalRequired()

      // Expect
      expect(result).toBe(true)
    })

    it("should return true if the plan contains a plain resource that requires approval and the action matches", async () => {
      // Given
      const resourceType: string = "aws_s3_bucket"
      const resourceName: string = "my_bucket"
      const resourceAddress: string = "aws_s3_bucket.my_bucket"

      const terraformEntities: TerraformEntity[] = [
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: resourceType,
            userProvidedName: resourceName
          },
          requireApproval: {
            type: "manual_approval",
            matchActions: [ApprovalAction.CREATE]
          }
        }
      ]

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const terraformDiffMap = {
        [resourceAddress]: diffFromPlan
      }

      jest.spyOn(bootstrappingService, "bootstrap").mockResolvedValue({
        terraformDiffMap,
        terraformEntities
      })

      // When
      const result = await approvalService.isApprovalRequired()

      // Expect
      expect(result).toBe(true)
    })

    it("should return false if the plan contains a plain resource but the action does not match", async () => {
      // Given
      const resourceType: string = "aws_s3_bucket"
      const resourceName: string = "my_bucket"
      const resourceAddress: string = "aws_s3_bucket.my_bucket"

      const terraformEntities: TerraformEntity[] = [
        {
          entityInfo: {
            internalType: "plain_resource",
            providerType: resourceType,
            userProvidedName: resourceName
          },
          requireApproval: {
            type: "manual_approval",
            matchActions: [ApprovalAction.DELETE]
          }
        }
      ]

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const terraformDiffMap = {
        [resourceAddress]: diffFromPlan
      }

      jest.spyOn(bootstrappingService, "bootstrap").mockResolvedValue({
        terraformDiffMap,
        terraformEntities
      })

      // When
      const result = await approvalService.isApprovalRequired()

      // Expect
      expect(result).toBe(false)
    })
  })
})
