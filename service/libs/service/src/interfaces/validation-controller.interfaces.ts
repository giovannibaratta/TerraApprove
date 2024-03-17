import {BaseValidationControllerItem} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export interface ValidationControllerRepository {
  createValidationController: (
    request: CreateValidationController
  ) => TaskEither<
    CreateValidationControllerItemError,
    BaseValidationControllerItem
  >
}

export interface ValidationControllerEventPublisher {
  publishValidationSourceCodeState(
    validationSourceCodeState: ValidationSourceCodeState
  ): TaskEither<never, void>
  publishValidationPlanState(
    validationPlanState: ValidationPlanState
  ): TaskEither<never, void>
}

export type CreateValidationControllerItemError =
  | "run_not_found"
  | "validation_controller_already_exist_for_run"
  | "unknown_source_code_state"
  | "unknown_plan_state"

export interface CreateValidationController {
  validationControllerItem: BaseValidationControllerItem
  runId: string
}

export interface ValidationSourceCodeState {
  state: BaseValidationControllerItem["sourceCodeState"]
  id: string
  revision: bigint
  updatedAt: Date
}

export interface ValidationPlanState {
  state: BaseValidationControllerItem["planState"]
  id: string
  revision: bigint
  updatedAt: Date
}

export const VALIDATION_CONTROLLER_REPOSITORY_TOKEN =
  "VALIDATION_CONTROLLER_REPOSITORY_TOKEN"

export const VALIDATION_CONTROLLER_EVENT_PUBLISHER_TOKEN =
  "VALIDATION_CONTROLLER_EVENT_PUBLISHER_TOKEN"
