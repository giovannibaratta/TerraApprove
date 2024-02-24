import {Module} from "@nestjs/common"
import {ServiceModule} from "@libs/service/service.module"
import {SourceCodeController} from "./controller/source-code.controller"
import {PlanController} from "./controller/plan.controller"
import {RunController} from "./controller/run.controller"

@Module({
  imports: [ServiceModule],
  controllers: [SourceCodeController, PlanController, RunController],
  providers: []
})
export class AppModule {}
