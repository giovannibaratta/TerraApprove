import {ApprovalAction} from "../terraform/approval"

export interface Configuration {
  readonly requireApprovalItems: RequireApprovalItem[]
}

export interface RequireApprovalItem {
  readonly fullQualifiedAddress: string
  readonly matchActions: ReadonlyArray<ApprovalAction>
}
