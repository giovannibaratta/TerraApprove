import {PLAN_READER} from "@libs/service/plan-reader/plan-reader"
import {Module} from "@nestjs/common"
import {FilePlanReader} from "./file-plan-reader/file-plan-reader"

const planReader = {
  provide: PLAN_READER,
  useClass: FilePlanReader
}

@Module({
  providers: [planReader],
  exports: [planReader]
})
export class ExternalModule {}
