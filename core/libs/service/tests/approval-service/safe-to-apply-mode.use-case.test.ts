import {Action, TerraformDiff} from "@libs/domain/terraform/diffs"
import {TerraformEntity} from "@libs/domain/terraform/resource"
import {SafeToApplyModeUseCase} from "@libs/service/approval/safe-to-apply-mode.use-case"
import {mockConfiguration} from "@libs/testing/mocks/configuration.mock"
import {generateTerraformResource} from "@libs/testing/random"
import {Test, TestingModule} from "@nestjs/testing"

describe("SafeToApplyModeUseCase", () => {
  let useCase: SafeToApplyModeUseCase

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafeToApplyModeUseCase]
    }).compile()

    useCase = module.get(SafeToApplyModeUseCase)
  })

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe("isApprovalRequired", () => {
    it("should return true if the plan contains resource that are not safe to apply", async () => {
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

      const configuration = mockConfiguration()

      // When
      const result = await useCase.isApprovalRequired({
        configuration,
        diffsEntityPairs
      })

      // Expect
      expect(result).toBe(true)
    })

    it(
      "should return false if the plan contains only " +
        "resources that are safe to apply (defined in the decorator)",
      async () => {
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
            type: "safe_to_apply"
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
      }
    )

    it(
      "should return false if the plan contains only " +
        "resources that are safe to apply (defined in the global rules)",
      async () => {
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
            safeToApplyActions: [Action.CREATE]
          }
        })

        // When
        const result = await useCase.isApprovalRequired({
          configuration,
          diffsEntityPairs
        })

        // Expect
        expect(result).toBe(false)
      }
    )

    it(
      "should return false if the plan contains only " +
        "resources that are safe to apply (defined in the global rules and the decorator)",
      async () => {
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
            type: "safe_to_apply",
            matchActions: [Action.DELETE]
          }
        }

        const diffFromPlan: TerraformDiff = {
          fullyQualifiedAddress: resourceAddress,
          userProvidedName: resourceName,
          providerType: resourceType,
          diffType: "replace"
        }

        const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
          [diffFromPlan, terraformEntity]
        ]

        const configuration = mockConfiguration({
          global: {
            safeToApplyActions: [Action.CREATE]
          }
        })

        // When
        const result = await useCase.isApprovalRequired({
          configuration,
          diffsEntityPairs
        })

        // Expect
        expect(result).toBe(false)
      }
    )

    it("should return false if the plan contains only actions specified in the decorator", async () => {
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
          type: "safe_to_apply",
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
      expect(result).toBe(false)
    })

    it("should return true if the plan contains actions that are not specified in the decorator", async () => {
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
          type: "safe_to_apply",
          matchActions: [Action.CREATE]
        }
      }

      const diffFromPlan: TerraformDiff = {
        fullyQualifiedAddress: resourceAddress,
        userProvidedName: resourceName,
        providerType: resourceType,
        diffType: "replace"
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
  })

  it("should return false if the plan contains resources of type that are safe to apply", async () => {
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
        safeToApplyItems: [
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
    expect(result).toBe(false)
  })

  it("should return false if the diff is matched by a global matcher (provider type and actions)", async () => {
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
      diffType: "replace"
    }

    const diffsEntityPairs: [TerraformDiff, TerraformEntity][] = [
      [diffFromPlan, terraformEntity]
    ]

    const configuration = mockConfiguration({
      global: {
        safeToApplyItems: [
          {
            providerType: resourceType,
            actions: [Action.DELETE, Action.CREATE]
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
    expect(result).toBe(false)
  })
})
