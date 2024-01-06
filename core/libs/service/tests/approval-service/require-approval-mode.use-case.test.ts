import {Action, TerraformDiff} from "@libs/domain/terraform/diffs"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {RequireApprovalModeUseCase} from "@libs/service/approval/require-approval-mode.use-case"
import {mockConfiguration} from "@libs/testing/mocks/configuration.mock"
import {generateTerraformResource} from "@libs/testing/random"
import {Test, TestingModule} from "@nestjs/testing"

describe("RequireApprovalModeUseCase", () => {
  let useCase: RequireApprovalModeUseCase

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequireApprovalModeUseCase]
    }).compile()

    useCase = module.get(RequireApprovalModeUseCase)
  })

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe("isApprovalRequired", () => {
    it("should return true if the plan contains a plain resource that requires approval", async () => {
      // Given
      const {resourceType, resourceName, resourceAddress} =
        generateTerraformResource()

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "plain_resource",
          providerType: resourceType,
          userProvidedName: resourceName
        },
        decorator: {type: "manual_approval"}
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration()

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })

    it("should return true if the plan contains a resource defined in a module that requires approval", async () => {
      // Given
      const moduleName = "my_module"

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "module",
          userProvidedName: moduleName
        },
        decorator: {type: "manual_approval"}
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: "fq_address",
        userProvidedName: "my_bucket",
        providerType: "aws_s3_bucket",
        diffType: "create",
        firstLevelModule: moduleName
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration()

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })

    it("should return true if the plan contains a plain resource that requires approval and the action matches", async () => {
      // Given
      const {resourceType, resourceName, resourceAddress} =
        generateTerraformResource()

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "plain_resource",
          providerType: resourceType,
          userProvidedName: resourceName
        },
        decorator: {
          type: "manual_approval",
          matchActions: [Action.CREATE]
        }
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration()

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })

    it("should return false if the plan contains a plain resource but the action does not match", async () => {
      // Given
      const {resourceType, resourceName, resourceAddress} =
        generateTerraformResource()

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "plain_resource",
          providerType: resourceType,
          userProvidedName: resourceName
        },
        decorator: {
          type: "manual_approval",
          matchActions: [Action.DELETE]
        }
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration()

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(false)
    })

    it("should return true if the plan contains a diff type included in the global match actions", async () => {
      // Given
      const {resourceType, resourceName, resourceAddress} =
        generateTerraformResource()

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "plain_resource",
          providerType: resourceType,
          userProvidedName: resourceName
        },
        decorator: {
          type: "no_decorator"
        }
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration({
        global: {
          requireApprovalActions: [Action.CREATE]
        }
      })

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })

    it("should return true if diff is matched by a global matcher (provider type only)", async () => {
      // Given
      const {resourceType, resourceName, resourceAddress} =
        generateTerraformResource()

      const terraformEntity: TerraformEntity = {
        entityInfo: {
          internalType: "plain_resource",
          providerType: resourceType,
          userProvidedName: resourceName
        },
        decorator: {
          type: "no_decorator"
        }
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "create"
      }

      const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
        [diffFromPlan, terraformEntity]
      ]

      const configuration = mockConfiguration({
        global: {
          requireApprovalItems: [
            {
              providerType: resourceType
            }
          ]
        }
      })

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })
  })

  it("should return true if diff is matched by a global matcher (provider type and action)", async () => {
    // Given
    const {resourceType, resourceName, resourceAddress} =
      generateTerraformResource()

    const terraformEntity: TerraformEntity = {
      entityInfo: {
        internalType: "plain_resource",
        providerType: resourceType,
        userProvidedName: resourceName
      },
      decorator: {
        type: "no_decorator"
      }
    }

    const diffFromPlan: TerraformDiff = {
      fullyQualifiedAddress: resourceAddress,
      userProvidedName: resourceName,
      providerType: resourceType,
      diffType: "create"
    }

    const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
      [diffFromPlan, terraformEntity]
    ]

    const configuration = mockConfiguration({
      global: {
        requireApprovalItems: [
          {
            providerType: resourceType,
            actions: [Action.CREATE]
          }
        ]
      }
    })

    // When
    const result = await useCase.isApprovalRequired({
      configuration,
      diffsEntityPairs
    })

    // Expect
    expect(result).toBe(true)
  })
})
