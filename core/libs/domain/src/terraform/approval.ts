export type DecoratorType = NoDecorator | ManualApproval | SafeToApply

export interface NoDecorator {
  readonly type: "no_decorator"
}

export interface ManualApproval {
  readonly type: "manual_approval"
  readonly matchActions?: ReadonlyArray<ApprovalAction>
}

export interface SafeToApply {
  readonly type: "safe_to_apply"
}

export enum ApprovalAction {
  CREATE = "CREATE",
  UPDATE_IN_PLACE = "UPDATE_IN_PLACE",
  DELETE = "DELETE"
}
