import {BaseRun} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export interface RunRepository {
  createRun(request: CreateRun): TaskEither<"unknown_run_state", BaseRun>
}

export interface CreateRun {
  baseRun: BaseRun
  sourceCodeId: string
  planId: string
}

export const RUN_REPOSITORY_TOKEN = "RUN_REPOSITORY_TOKEN"
