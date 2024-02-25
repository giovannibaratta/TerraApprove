import {BaseRun} from "@libs/domain"
import {RunDbRepository} from "@libs/external/db/run.repository"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {randomUUID} from "crypto"
import {Either} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"

@Injectable()
export class RunService {
  constructor(
    @Inject("RUN_REPOSITORY_TOKEN")
    private readonly runRepository: RunDbRepository
  ) {}

  async createRun(
    request: CreateRun
  ): Promise<Either<"unknown_run_state", string>> {
    const createdAt = new Date()

    // Wrap in a lambda to preserve the "this" context
    const persistRun = (req: CreateRun) =>
      this.runRepository.createRun({
        sourceCodeId: req.sourceCodeId,
        planId: req.planId,
        baseRun: {
          createdAt,
          updatedAt: createdAt,
          state: "pending_validation",
          id: randomUUID(),
          revision: 0n
        }
      })

    const result = await pipe(
      request,
      TE.right,
      TE.chainW(persistRun),
      TE.chainW((result: BaseRun) => logCreateResult(result, request)),
      TE.map(result => result.id)
    )()

    return result
  }
}

const logCreateResult = (result: BaseRun, conxtext: CreateRun) => {
  Logger.log(
    `Created run with id ${result} for source code ${conxtext.sourceCodeId} and plan ${conxtext.planId}`
  )
  return TE.right(result)
}

export interface CreateRun {
  sourceCodeId: string
  planId: string
}
