import {fs} from "memfs"
import {FilePlanReader} from "@libs/external/file-plan-reader/file-plan-reader"
import {Test} from "@nestjs/testing"
import "expect-more-jest"
import {Logger} from "@nestjs/common"

jest.mock("fs", () => fs)

describe("FilePlanReader", () => {
  let filePlanReader: FilePlanReader

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilePlanReader]
    }).compile()

    filePlanReader = module.get(FilePlanReader)

    jest.spyOn(Logger, "error").mockImplementation(() => {})
  })

  it("should read the plan and return the diffs", async () => {
    // Given
    const planLocation = "/plan.json"
    const resourceType = "aws_instance"
    const resourceName = "example"
    const resourceAddress = "unique_resource_address"
    const planContent = {
      resource_changes: [
        {
          address: resourceAddress,
          type: resourceType,
          name: resourceName,
          change: {
            actions: ["create"]
          }
        }
      ]
    }

    fs.writeFileSync(planLocation, JSON.stringify(planContent))

    // When
    const result = await filePlanReader.readPlan(planLocation)

    // Then
    expect(result).toMatchObject({
      right: {
        [resourceAddress]: {
          providerType: resourceType,
          userProvidedName: resourceName,
          diffType: "create"
        }
      }
    })
  })

  it("should correctly extract the first level module name for a nested resource", async () => {
    // Given
    const planLocation = "/plan.json"
    const firstLevelModuleName = "first_module"
    const moduleAddress = `module.${firstLevelModuleName}.module.sub_module_name`

    const planContent = {
      resource_changes: [
        {
          address: "fq_resource_address",
          type: "aws_instance",
          name: "example",
          module_address: moduleAddress,
          change: {
            actions: ["create"]
          }
        }
      ]
    }

    fs.writeFileSync(planLocation, JSON.stringify(planContent))

    // When
    const result = await filePlanReader.readPlan(planLocation)

    // Then
    expect(result).toMatchObject({
      right: {
        fq_resource_address: expect.objectContaining({
          firstLevelModule: firstLevelModuleName
        })
      }
    })
  })

  it("should ignore no-op and read diffs", async () => {
    // Given
    const planLocation = "/plan.json"
    const planContent = {
      resource_changes: [
        {
          type: "aws_instance",
          name: "example",
          change: {
            actions: ["no-op"]
          }
        },
        {
          type: "aws_instance",
          name: "example2",
          change: {
            actions: ["read"]
          }
        }
      ]
    }

    fs.writeFileSync(planLocation, JSON.stringify(planContent))

    // When
    const result = await filePlanReader.readPlan(planLocation)

    // Then
    expect(result).toMatchObject({
      right: {}
    })
  })

  it(
    "should return 'ambiguous_diff' " +
      "if the plan contains two resources with the same type and name",
    async () => {
      // Given
      const planLocation = "/plan.json"
      const planContent = {
        resource_changes: [
          {
            address: "non_unique_resource_address",
            type: "aws_instance",
            name: "example",
            change: {
              actions: ["create"]
            }
          },
          {
            address: "non_unique_resource_address",
            type: "aws_instance",
            name: "example",
            change: {
              actions: ["update"]
            }
          }
        ]
      }

      fs.writeFileSync(planLocation, JSON.stringify(planContent))

      // When
      const result = await filePlanReader.readPlan(planLocation)

      // Then
      expect(result).toMatchObject({
        left: "ambiguous_diff"
      })
    }
  )
})
