import {
  ApprovalService,
  IsApprovalRequiredParams
} from "@libs/service/approval/approval.service"
import {RequireApprovalModeUseCase} from "@libs/service/approval/require-approval-mode.use-case"
import {SafeToApplyModeUseCase} from "@libs/service/approval/safe-to-apply-mode.use-case"
import {
  BootstapResult,
  BootstrappingService
} from "@libs/service/bootstrapping/bootstrapping.service"
import {Test, TestingModule} from "@nestjs/testing"
import {BootstrappingServiceMock} from "../mocks/bootstrapping.service.mock"
import {RequireApprovalModeUseCaseMock} from "../mocks/require-approva-mode.use-case.mock"
import {SafeToApplyModeUseCaseMock} from "../mocks/safe-to-apply-mode.use-case.mock"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {mockConfiguration} from "@libs/testing/mocks/configuration.mock"

describe("ApprovalService", () => {
  let approvalService: ApprovalService
  let bootstrappingService: BootstrappingService
  let requireApprovalModeUseCase: RequireApprovalModeUseCase
  let safeToApplyModeUseCase: SafeToApplyModeUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: BootstrappingService,
          useClass: BootstrappingServiceMock
        },
        {
          provide: RequireApprovalModeUseCase,
          useClass: RequireApprovalModeUseCaseMock
        },
        {
          provide: SafeToApplyModeUseCase,
          useClass: SafeToApplyModeUseCaseMock
        }
      ]
    }).compile()

    approvalService = module.get(ApprovalService)
    bootstrappingService = module.get(BootstrappingService)
    requireApprovalModeUseCase = module.get(RequireApprovalModeUseCase)
    safeToApplyModeUseCase = module.get(SafeToApplyModeUseCase)

    jest.restoreAllMocks()
  })

  describe("isApprovalRequired", () => {
    it("should call requireApprovalModeUseCase.isApprovalRequired if mode is require_approval", async () => {
      // Given
      const mode = "require_approval"
      const bootstrapResult: BootstapResult = {
        terraformEntities: [] as TerraformEntity[],
        terraformDiffMap: {},
        configuration: mockConfiguration()
      }

      const isApprovalRequiredResult = true

      jest
        .spyOn(bootstrappingService, "bootstrap")
        .mockResolvedValue(bootstrapResult)
      jest
        .spyOn(requireApprovalModeUseCase, "isApprovalRequired")
        .mockReturnValue(isApprovalRequiredResult)

      // When
      const result = await approvalService.isApprovalRequired({mode})

      // Expect
      expect(result).toBe(isApprovalRequiredResult)
    })

    it("should call safeToApplyModeUseCase.isApprovalRequired if mode is safe_to_apply", async () => {
      // Given
      const mode = "safe_to_apply"
      const bootstrapResult: BootstapResult = {
        terraformEntities: [] as TerraformEntity[],
        terraformDiffMap: {},
        configuration: mockConfiguration()
      }

      const isApprovalRequiredResult = true

      jest
        .spyOn(bootstrappingService, "bootstrap")
        .mockResolvedValue(bootstrapResult)
      jest
        .spyOn(safeToApplyModeUseCase, "isApprovalRequired")
        .mockReturnValue(isApprovalRequiredResult)

      // When
      const result = await approvalService.isApprovalRequired({mode})

      // Expect
      expect(result).toBe(isApprovalRequiredResult)
    })

    it("should throw an error if mode is not supported", async () => {
      // Given
      const mode: IsApprovalRequiredParams["mode"] =
        "not_supported" as IsApprovalRequiredParams["mode"]

      const bootstrapResult: BootstapResult = {
        terraformEntities: [] as TerraformEntity[],
        terraformDiffMap: {},
        configuration: mockConfiguration()
      }

      const isApprovalRequiredResult = true

      jest
        .spyOn(bootstrappingService, "bootstrap")
        .mockResolvedValue(bootstrapResult)
      jest
        .spyOn(safeToApplyModeUseCase, "isApprovalRequired")
        .mockReturnValue(isApprovalRequiredResult)

      // When
      const result = approvalService.isApprovalRequired({mode})

      // Expect
      await expect(result).rejects.toThrow("Mode not supported")
    })

    it("should throw an error if the diff from the plan does not have a counterpart in the code base", async () => {
      // Given
      const mode = "safe_to_apply"
      const bootstrapResult: BootstapResult = {
        terraformEntities: [] as TerraformEntity[],
        terraformDiffMap: {
          "aws_s3_bucket.my_bucket": {
            fullyQualifiedAddress: "aws_s3_bucket.my_bucket",
            userProvidedName: "my_bucket",
            providerType: "aws_s3_bucket",
            diffType: "create"
          }
        },
        configuration: mockConfiguration()
      }

      const isApprovalRequiredResult = true

      jest
        .spyOn(bootstrappingService, "bootstrap")
        .mockResolvedValue(bootstrapResult)
      jest
        .spyOn(safeToApplyModeUseCase, "isApprovalRequired")
        .mockReturnValue(isApprovalRequiredResult)

      // When
      const result = approvalService.isApprovalRequired({mode})

      // Expect
      await expect(result).rejects.toThrow(
        "Could not find counterpart for diff"
      )
    })

    it("should correctly map the diff from the plan to the entity from the code base", async () => {
      // Given
      const mode = "safe_to_apply"
      const bootstrapResult: BootstapResult = {
        terraformEntities: [
          {
            entityInfo: {
              internalType: "plain_resource",
              providerType: "aws_s3_bucket",
              userProvidedName: "my_bucket"
            },
            decorator: {
              type: "no_decorator"
            }
          }
        ] as TerraformEntity[],
        terraformDiffMap: {
          "aws_s3_bucket.my_bucket": {
            fullyQualifiedAddress: "aws_s3_bucket.my_bucket",
            userProvidedName: "my_bucket",
            providerType: "aws_s3_bucket",
            diffType: "create"
          }
        },
        configuration: mockConfiguration()
      }

      jest
        .spyOn(bootstrappingService, "bootstrap")
        .mockResolvedValue(bootstrapResult)
      jest
        .spyOn(safeToApplyModeUseCase, "isApprovalRequired")
        .mockReturnValue(false)

      // When
      await approvalService.isApprovalRequired({mode})

      // Expect
      expect(safeToApplyModeUseCase.isApprovalRequired).toHaveBeenCalledWith({
        configuration: bootstrapResult.configuration,
        diffsEntityPairs: [
          [
            bootstrapResult.terraformDiffMap["aws_s3_bucket.my_bucket"],
            bootstrapResult.terraformEntities[0]
          ]
        ]
      })
    })
  })
})
