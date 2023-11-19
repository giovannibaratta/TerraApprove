import {
  DecoratorType,
  getSafeToApplyActionsFromDecorator
} from "@libs/domain/terraform/approval"
import {Action} from "@libs/domain/terraform/diffs"

describe("getSafeToApplyActionsFromDecorator", () => {
  it("should return an empty array if the decorator is not of the right type", () => {
    // Given
    const decorator: DecoratorType = {type: "no_decorator"}

    // When
    const safeActions = getSafeToApplyActionsFromDecorator(decorator)

    // Expect
    expect(safeActions).toEqual([])
  })

  it("should return an empty array if the decorator is of the right type but matchActions is undefined", () => {
    // Given
    const decorator: DecoratorType = {type: "safe_to_apply"}

    // When
    const safeActions = getSafeToApplyActionsFromDecorator(decorator)

    // Expect
    expect(safeActions).toEqual(Object.values(Action))
  })

  it("should return the matchActions if the decorator is of the right type and matchActions are defined and is empty", () => {
    // Given
    const decorator: DecoratorType = {
      type: "safe_to_apply",
      matchActions: []
    }

    // When
    const safeActions = getSafeToApplyActionsFromDecorator(decorator)

    // Expect
    expect(safeActions).toEqual([])
  })

  it("should return the matchActions if the decorator is of the right type and matchActions are defined and not empty", () => {
    // Given
    const decorator: DecoratorType = {
      type: "safe_to_apply",
      matchActions: [Action.CREATE]
    }

    // When
    const safeActions = getSafeToApplyActionsFromDecorator(decorator)

    // Expect
    expect(safeActions).toEqual([Action.CREATE])
  })
})
