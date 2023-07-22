import {validate} from "@domain/validator/validator"

describe("validate", () => {
  it("should pass the test", () => {
    const result = validate("PASS")
    expect(result).toBe(true)
  })
})
