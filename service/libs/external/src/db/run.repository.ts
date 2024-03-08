import {Injectable, Logger} from "@nestjs/common"
import {DatabaseClient} from "./database-client"
import {Prisma, Run as PrismaRun} from "@prisma/client"
import {
  CreateRun,
  CreateRunError,
  RunRepository
} from "@libs/service/interfaces/run.interfaces"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import {BaseRun} from "@libs/domain"
import {Either, isLeft} from "fp-ts/lib/Either"
import {either} from "fp-ts"

@Injectable()
export class RunDbRepository implements RunRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  createRun(request: CreateRun): TaskEither<CreateRunError, BaseRun> {
    const result = pipe(
      request,
      TE.right,
      TE.chainW(this.persistObjectTask()),
      TE.chainW(mapToDomain)
    )
    return result
  }

  private persistObjectTask(): (
    request: CreateRun
  ) => TaskEither<CreateRunError, PrismaRun> {
    return request =>
      TE.tryCatchK(
        () =>
          this.dbClient.run.create({
            data: {
              createdAt: request.baseRun.createdAt,
              state: request.baseRun.state,
              sourceCodeId: request.sourceCodeId,
              planId: request.planId,
              id: request.baseRun.id,
              updatedAt: request.baseRun.updatedAt,
              revision: request.baseRun.revision
            }
          }),
        mapToLeft
      )()
  }
}

const PRISMA_FOREIGN_KEY_VIOLATION_ERROR_CODE = "P2003"

// These are the values that Prisma returns for the field_name property of the meta object
// when a foreign key violation occurs. The values depends on the name of the constraint
// in the database.
const PRISMA_SOURCE_CODE_FK_VIOLATION_FIELD_NAME_VALUE =
  "fk_runs_source_code_id (index)"
const PRISMA_PLAN_FK_VIOLATION_FIELD_NAME_VALUE = "fk_runs_plans_id (index)"

function mapToLeft(error: unknown): CreateRunError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_FOREIGN_KEY_VIOLATION_ERROR_CODE
  ) {
    if (
      isPrismaForeignKeyViolationErrorForTarget(
        error,
        PRISMA_SOURCE_CODE_FK_VIOLATION_FIELD_NAME_VALUE
      )
    )
      return "source_code_not_found"

    if (
      isPrismaForeignKeyViolationErrorForTarget(
        error,
        PRISMA_PLAN_FK_VIOLATION_FIELD_NAME_VALUE
      )
    )
      return "plan_not_found"
  }

  Logger.error("Error while creating run")
  throw error
}

function isPrismaForeignKeyViolationErrorForTarget(
  error: unknown,
  target: string
): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_FOREIGN_KEY_VIOLATION_ERROR_CODE &&
    error.meta !== undefined &&
    Object.hasOwnProperty.call(error.meta, "field_name") &&
    typeof error.meta.field_name === "string" &&
    error.meta.field_name === target
  )
}

function mapToDomain(run: PrismaRun): TaskEither<"unknown_run_state", BaseRun> {
  const eitherState = mapState(run.state)

  if (isLeft(eitherState)) {
    return TE.left(eitherState.left)
  }

  return TE.right({
    id: run.id,
    state: eitherState.right,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    revision: run.revision
  })
}

function mapState(
  rawState: string
): Either<"unknown_run_state", BaseRun["state"]> {
  switch (rawState) {
    case "pending_validation":
      return either.right("pending_validation")
    case "pending_approval":
      return either.right("pending_approval")
    case "approved":
      return either.right("approved")
    case "rejected":
      return either.right("rejected")
    default:
      return either.left("unknown_run_state")
  }
}
