import {Injectable, Logger} from "@nestjs/common"
import {DatabaseClient} from "./database-client"
import {Run as PrismaRun} from "@prisma/client"
import {CreateRun, RunRepository} from "@libs/service/interfaces/run.interfaces"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import {BaseRun} from "@libs/domain"
import {Either, isLeft} from "fp-ts/lib/Either"
import {either} from "fp-ts"

@Injectable()
export class RunDbRepository implements RunRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  createRun(request: CreateRun): TaskEither<"unknown_run_state", BaseRun> {
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
  ) => TaskEither<never, PrismaRun> {
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
        error => {
          Logger.error("Error while creating run")
          throw error
        }
      )()
  }
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
