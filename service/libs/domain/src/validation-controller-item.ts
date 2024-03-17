import {BaseRun} from "./run"

export interface BaseValidationControllerItem {
  id: string
  startedAt: Date
  updatedAt: Date
  sourceCodeState: SourceCodeState
  planState: PlanState
  revision: bigint
}

export interface ValidationControllerItem extends BaseValidationControllerItem {
  run: BaseRun
}

export type SourceCodeState = "pending_download" | "downloaded" | "failed"
export type PlanState = "pending_download" | "downloaded" | "failed"
