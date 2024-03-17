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

export type CreateValidationControllerItemError =
  | "run_not_found"
  | "validation_controller_already_exist_for_run"
  | "unknown_source_code_state"
  | "unknown_plan_state"

export interface CreateValidationController {
  validationControllerItem: BaseValidationControllerItem
  runId: string
}

export const VALIDATION_CONTROLLER_REPOSITORY_TOKEN =
  "VALIDATION_CONTROLLER_REPOSITORY_TOKEN"
