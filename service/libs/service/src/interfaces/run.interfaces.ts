import {BaseRun} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export interface RunRepository {
  createRun(request: CreateRun): TaskEither<"unknown_run_state", BaseRun>
}

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
