import {PLAN_REPOSITORY_TOKEN} from "@libs/service/interfaces/plan.interfaces"
import {
  RUN_EVENT_PUBLISHER_TOKEN,
  RUN_REPOSITORY_TOKEN
} from "@libs/service/interfaces/run.interfaces"
import {SOURCE_CODE_REPOSITORY_TOKEN} from "@libs/service/interfaces/source-code.interfaces"
import {Module} from "@nestjs/common"
import {Config} from "./config/config"
import {DatabaseClient} from "./db/database-client"
import {PlanDbRepository} from "./db/plan.repository"
import {RunDbRepository} from "./db/run.repository"
import {SourceCodeDbRepository} from "./db/source-code.repository"
import {KafkaPublisher} from "./kafka/kafka-publisher"
import {RunKafkaEventPublisher} from "./kafka/run.event-publisher"
import {ValidationControllerDbRepository} from "./db/validation-controller.repository"
import {VALIDATION_CONTROLLER_REPOSITORY_TOKEN} from "@libs/service/interfaces/validation-controller.interfaces"

const sourceCodeRepository = {
  provide: SOURCE_CODE_REPOSITORY_TOKEN,
  useClass: SourceCodeDbRepository
}

const planRepository = {
  provide: PLAN_REPOSITORY_TOKEN,
  useClass: PlanDbRepository
}

const runRepository = {
  provide: RUN_REPOSITORY_TOKEN,
  useClass: RunDbRepository
}

const runEventPublisher = {
  provide: RUN_EVENT_PUBLISHER_TOKEN,
  useClass: RunKafkaEventPublisher
}

const validationController = {
  provide: VALIDATION_CONTROLLER_REPOSITORY_TOKEN,
  useClass: ValidationControllerDbRepository
}

@Module({
  imports: [],
  providers: [
    sourceCodeRepository,
    planRepository,
    runRepository,
    validationController,
    runEventPublisher,
    DatabaseClient,
    KafkaPublisher,
    Config
  ],
  exports: [
    sourceCodeRepository,
    planRepository,
    runRepository,
    validationController,
    runEventPublisher
  ]
})
export class ExternalModule {}
