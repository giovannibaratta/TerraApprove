import {BaseValidationControllerItem} from "@libs/domain"
import {
  CreateValidationController,
  CreateValidationControllerItemError,
  ValidationControllerRepository
} from "@libs/service/interfaces/validation-controller.interfaces"
import {Injectable, Logger} from "@nestjs/common"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {DatabaseClient} from "./database-client"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import {
  Prisma,
  ValidationController as PrismaValidationController
} from "@prisma/client"
import {Either} from "fp-ts/lib/Either"
import {either} from "fp-ts"
import {isPrismaForeignKeyViolationErrorForTarget} from "./shared"

@Injectable()
export class ValidationControllerDbRepository
  implements ValidationControllerRepository
{
  constructor(private readonly dbClient: DatabaseClient) {}

  createValidationController(
    request: CreateValidationController
  ): TaskEither<
    CreateValidationControllerItemError,
    BaseValidationControllerItem
  > {
    const result = pipe(
      request,
      TE.right,
      TE.chainW(this.persistObjectTask()),
      TE.chainW(mapToDomain)
    )

    return result
  }

  private persistObjectTask(): (
    request: CreateValidationController
  ) => TaskEither<
    CreateValidationControllerItemError,
    PrismaValidationController
  > {
    // Wrap in a lambda to preserve the "this" context
    return request =>
      TE.tryCatchK(
        () =>
          this.dbClient.$transaction(
            async tx => {
              // We use an optimistic locking strategy to ensure that we don't create two validation controller
              // items for the same run. If after creating the validation controller item, we find that there
              // is already another validation controller item for the same run, we rollback the transaction and
              // return an error.
              const item = await tx.validationController.create({
                data: {
                  startedAt: new Date(),
                  updatedAt: new Date(),
                  sourceCodeState: "pending_download",
                  planState: "pending_download",
                  revision: 0n,
                  runId: request.runId,
                  id: request.validationControllerItem.id
                }
              })

              const count = await tx.validationController.count({
                where: {
                  runId: request.runId
                }
              })

              if (count > 1) {
                throw new DuplicatedValidationControllerError()
              }

              return item
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
            }
          ),
        mapToLeft
      )()
  }
}

function mapSourceCodeState(
  rawState: string
): Either<
  "unknown_source_code_state",
  BaseValidationControllerItem["sourceCodeState"]
> {
  switch (rawState) {
    case "pending_download":
      return either.right("pending_download")
    case "downloaded":
      return either.right("downloaded")
    case "failed":
      return either.right("failed")
    default:
      return either.left("unknown_source_code_state")
  }
}

function mapPlanState(
  rawState: string
): Either<"unknown_plan_state", BaseValidationControllerItem["planState"]> {
  switch (rawState) {
    case "pending_download":
      return either.right("pending_download")
    case "downloaded":
      return either.right("downloaded")
    case "failed":
      return either.right("failed")
    default:
      return either.left("unknown_plan_state")
  }
}

function mapToDomain(
  dbObject: PrismaValidationController
): TaskEither<
  "unknown_source_code_state" | "unknown_plan_state",
  BaseValidationControllerItem
> {
  const eitherSourceCodeState = mapSourceCodeState(dbObject.sourceCodeState)
  const eitherPlanState = mapPlanState(dbObject.planState)

  if (either.isLeft(eitherSourceCodeState)) {
    return TE.left(eitherSourceCodeState.left)
  }

  if (either.isLeft(eitherPlanState)) {
    return TE.left(eitherPlanState.left)
  }

  return TE.right({
    id: dbObject.id,
    runId: dbObject.runId,
    sourceCodeState: eitherSourceCodeState.right,
    planState: eitherPlanState.right,
    revision: dbObject.revision,
    startedAt: dbObject.startedAt,
    updatedAt: dbObject.updatedAt
  })
}

// These are the values that Prisma returns for the field_name property of the meta object
// when a foreign key violation occurs. The values depends on the name of the constraint
// in the database.
const PRISMA_RUN_FK_VIOLATION_FIELD_NAME_VALUE =
  "fk_validation_controller_run_id (index)"

function mapToLeft(error: unknown): CreateValidationControllerItemError {
  if (error instanceof DuplicatedValidationControllerError) {
    return "validation_controller_already_exist_for_run"
  }

  if (
    isPrismaForeignKeyViolationErrorForTarget(
      error,
      PRISMA_RUN_FK_VIOLATION_FIELD_NAME_VALUE
    )
  )
    return "run_not_found"

  Logger.error("Error while creating run")
  throw error
}

class DuplicatedValidationControllerError extends Error {
  constructor() {
    super("Validation controller item already exists for this run")
  }
}
