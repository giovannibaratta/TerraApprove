import {Plan} from "./plan"
import {SourceCode} from "./source-code"

export interface BaseRun {
  readonly id: string
  readonly state:
    | "pending_validation"
    | "pending_approval"
    | "approved"
    | "rejected"
  createdAt: Date
  updatedAt: Date
}

export interface Run extends BaseRun {
  readonly sourceCode: SourceCode
  readonly plan: Plan
}

export function isRunApproved(run: BaseRun): boolean {
  return run.state === "approved"
}

export function isRunInProgress(run: BaseRun): boolean {
  return run.state !== "approved" && run.state !== "rejected"
}
