import {PLAN_READER} from "@libs/service/plan-reader/plan-reader"
import {Module} from "@nestjs/common"
import {FilePlanReader} from "./file-plan-reader/file-plan-reader"
import {CONFIGURATION_READER} from "@libs/service/configuration/configuration-reader"
import {FileConfigurationReader} from "./file-configuration-reader/file-configuration.reader"

const planReader = {
  provide: PLAN_READER,
  useClass: FilePlanReader
}

const configurationReader = {
  provide: CONFIGURATION_READER,
  useClass: FileConfigurationReader
}

@Module({
  providers: [planReader, configurationReader],
  exports: [planReader, configurationReader]
})
export class ExternalModule {}
