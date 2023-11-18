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
