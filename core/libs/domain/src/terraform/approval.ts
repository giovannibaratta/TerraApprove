import {Action} from "./diffs"

export type DecoratorType = NoDecorator | ManualApproval | SafeToApply

export interface NoDecorator {
  readonly type: "no_decorator"
}

export interface ManualApproval {
  readonly type: "manual_approval"
  readonly matchActions?: ReadonlyArray<Action>
}

export interface SafeToApply {
  readonly type: "safe_to_apply"
  readonly matchActions?: ReadonlyArray<Action>
}

export function getSafeToApplyActionsFromDecorator(
  decorator: DecoratorType
): ReadonlyArray<Action> {
  // If the decorator is not of the right type it means that there are no safe actions.
  // If the decorator is of the right type, if no matchActions is defined it means that all actions are safe.

  if (decorator.type !== "safe_to_apply") {
    return []
  }

  return decorator.matchActions ? decorator.matchActions : Object.values(Action)
}
