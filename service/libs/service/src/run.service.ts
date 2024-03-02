import {BaseRun} from "@libs/domain"
import {RunDbRepository} from "@libs/external/db/run.repository"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {randomUUID} from "crypto"
import {Either} from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import {RunEventPublisher} from "./interfaces/run.interfaces"

@Injectable()
export class RunService {
  constructor(
    @Inject("RUN_REPOSITORY_TOKEN")
    private readonly runRepository: RunDbRepository,
    @Inject("RUN_EVENT_PUBLISHER_TOKEN")
    private readonly runEventPublisher: RunEventPublisher
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

    const emitRunStateEvent = (run: BaseRun) =>
      pipe(
        run,
        TE.right,
        TE.chainW(value => this.runEventPublisher.publishRunState(value)),
        TE.map(() => run)
      )

    /* The emitting of the event could fail and the event could be lost forever but for now we are
      ignoring the issue in order not to overcomplicate the code at this stage. */
    const result = await pipe(
      request,
      TE.right,
      TE.chainW(persistRun),
      TE.chainW((result: BaseRun) => logCreateResult(result, request)),
      TE.chainW(emitRunStateEvent),
      TE.chainW(logEmitEventResult),
      TE.map(value => value.id)
    )()

    return result
  }
}

const logCreateResult = (result: BaseRun, conxtext: CreateRun) => {
  Logger.log(
    `Created run with id ${result.id} for source code ${conxtext.sourceCodeId} and plan ${conxtext.planId}`
  )
  return TE.right(result)
}

const logEmitEventResult = (result: BaseRun) => {
  Logger.log(
    `Published run state event for run ${result.id} with state ${result.state}`
  )
  return TE.right(result)
}

export interface CreateRun {
  sourceCodeId: string
  planId: string
}
