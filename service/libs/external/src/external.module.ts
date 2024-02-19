import {Module} from "@nestjs/common"
import {DatabaseClient} from "./db/database-client"
import {SOURCE_CODE_REPOSITORY_TOKEN} from "@libs/service/interfaces/source-code.interfaces"
import {SourceCodeDbRepository} from "./db/source-code.repository"
import {PLAN_REPOSITORY_TOKEN} from "@libs/service/interfaces/plan.interfaces"
import {PlanDbRepository} from "./db/plan.repository"
import {Config} from "./config/config"
import {RUN_REPOSITORY_TOKEN} from "@libs/service/interfaces/run.interfaces"
import {RunDbRepository} from "./db/run.repository"

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

@Module({
  imports: [],
  providers: [
    sourceCodeRepository,
    planRepository,
    runRepository,
    DatabaseClient,
    Config
  ],
  exports: [sourceCodeRepository, planRepository, runRepository]
})
export class ExternalModule {}
