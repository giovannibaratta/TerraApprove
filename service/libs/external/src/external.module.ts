import {Module} from "@nestjs/common"
import {DatabaseClient} from "./db/database-client"
import {SOURCE_CODE_REPOSITORY_TOKEN} from "@libs/service/interfaces/source-code.interfaces"
import {SourceCodeDbRepository} from "./db/source-code.repository"

const sourceCodeRepository = {
  provide: SOURCE_CODE_REPOSITORY_TOKEN,
  useClass: SourceCodeDbRepository
}

@Module({
  imports: [],
  providers: [sourceCodeRepository, DatabaseClient],
  exports: [sourceCodeRepository]
})
export class ExternalModule {}
