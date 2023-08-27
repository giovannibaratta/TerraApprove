export type ApprovalType = NoApproval | ManualApproval

interface NoApproval {
  readonly type: "no_approval"
}

export interface ManualApproval {
  readonly type: "manual_approval"
  readonly matchActions?: ReadonlyArray<ApprovalAction>
}

export enum ApprovalAction {
  CREATE = "CREATE",
  UPDATE_IN_PLACE = "UPDATE_IN_PLACE",
  DELETE = "DELETE"
}
