import {Module} from "@nestjs/common"
import {DatabaseClient} from "./db/database-client"
import {SOURCE_CODE_REPOSITORY_TOKEN} from "@libs/service/interfaces/source-code.interfaces"
import {SourceCodeDbRepository} from "./db/source-code.repository"
import {PLAN_REPOSITORY_TOKEN} from "@libs/service/interfaces/plan.interfaces"
import {PlanDbRepository} from "./db/plan.repository"
import {Config} from "./config/config"

const sourceCodeRepository = {
  provide: SOURCE_CODE_REPOSITORY_TOKEN,
  useClass: SourceCodeDbRepository
}

const planRepository = {
  provide: PLAN_REPOSITORY_TOKEN,
  useClass: PlanDbRepository
}

@Module({
  imports: [],
  providers: [sourceCodeRepository, planRepository, DatabaseClient, Config],
  exports: [sourceCodeRepository, planRepository]
})
export class ExternalModule {}
