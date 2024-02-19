import {Injectable, Logger} from "@nestjs/common"
import {DatabaseClient} from "./database-client"
import {CreateRun, RunRepository} from "@libs/service/interfaces/run.interfaces"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"

@Injectable()
export class RunDbRepository implements RunRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  createRun(request: CreateRun): TaskEither<never, string> {
    const result = pipe(request, TE.right, TE.chainW(this.persistObjectTask()))
    return result
  }

  private persistObjectTask(): (
    request: CreateRun
  ) => TaskEither<never, string> {
    return request =>
      TE.tryCatchK(
        () =>
          this.dbClient.run
            .create({
              data: {
                createdAt: request.baseRun.createdAt,
                state: request.baseRun.state,
                sourceCodeId: request.sourceCodeId,
                planId: request.planId,
                id: request.baseRun.id,
                updatedAt: request.baseRun.updatedAt
              },
              select: {
                id: true
              }
            })
            .then(result => result.id),
        error => {
          Logger.error("Error while creating run")
          throw error
        }
      )()
  }
}
