import {BaseRun} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export interface RunRepository {
  createRun(request: CreateRun): TaskEither<CreateRunError, BaseRun>
}

export type CreateRunError =
  | "unknown_run_state"
  | "source_code_not_found"
  | "plan_not_found"

export interface RunEventPublisher {
  publishRunState(runState: RunState): TaskEither<never, void>
}

export interface CreateRun {
  baseRun: BaseRun
  sourceCodeId: string
  planId: string
}

export interface RunState {
  state: BaseRun["state"]
  id: string
  revision: bigint
  updatedAt: Date
}

export const RUN_REPOSITORY_TOKEN = "RUN_REPOSITORY_TOKEN"
export const RUN_EVENT_PUBLISHER_TOKEN = "RUN_EVENT_PUBLISHER_TOKEN"
