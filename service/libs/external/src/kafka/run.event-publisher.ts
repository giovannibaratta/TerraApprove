import {
  RunEventPublisher,
  RunState
} from "@libs/service/interfaces/run.interfaces"
import {Injectable, Logger} from "@nestjs/common"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {KafkaPublisher} from "./kafka-publisher"
import * as TE from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import {Config} from "../config/config"

@Injectable()
export class RunKafkaEventPublisher implements RunEventPublisher {
  private readonly runStateChangedTopic: string

  constructor(
    private readonly kafkaPublisher: KafkaPublisher,
    readonly config: Config
  ) {
    this.runStateChangedTopic = config.kafkaConfig.topics.runStatusChanged
  }

  publishRunState(runState: RunState): TaskEither<never, void> {
    const result = pipe(
      runState,
      TE.right,
      TE.map(mapToEvent),
      TE.chainW(this.emitRunStateEvent())
    )

    return result
  }

  private emitRunStateEvent(): (event: string) => TaskEither<never, void> {
    return event =>
      TE.tryCatchK(
        () => this.kafkaPublisher.publish(this.runStateChangedTopic, event),
        error => {
          Logger.error("Error while publishing run state event")
          throw error
        }
      )()
  }
}

function mapToEvent(runState: RunState): string {
  return JSON.stringify({
    ...runState,
    revision: runState.revision.toString()
  })
}
