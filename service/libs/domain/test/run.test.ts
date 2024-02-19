import {BaseRun, isRunApproved, isRunInProgress} from "@libs/domain"
import {generateMockRun} from "@libs/testing"

describe("isRunApproved", () => {
  it("should return true if the run state is 'approved'", () => {
    // Given
    const run: BaseRun = generateMockRun({state: "approved"})

    // When
    const result = isRunApproved(run)

    // Expect
    expect(result).toBe(true)
  })

  it("should return false if the run state is not 'approved'", () => {
    // Given
    const run: BaseRun = generateMockRun({state: "pending_approval"})

    // When
    const result = isRunApproved(run)

    // Expect
    expect(result).toBe(false)
  })
})

describe("isRunInProgress", () => {
  it("should return true if the run state is not 'approved' or 'rejected'", () => {
    // Given
    const run: BaseRun = generateMockRun({state: "pending_approval"})

    // When
    const result = isRunInProgress(run)

    // Expect
    expect(result).toBe(true)
  })

  it("should return false if the run state is 'approved'", () => {
    // Given
    const run: BaseRun = generateMockRun({state: "approved"})

    // When
    const result = isRunInProgress(run)

    // Expect
    expect(result).toBe(false)
  })

  it("should return false if the run state is 'rejected'", () => {
    // Given
    const run: BaseRun = generateMockRun({state: "rejected"})

    // When
    const result = isRunInProgress(run)

    // Expect
    expect(result).toBe(false)
  })
})
