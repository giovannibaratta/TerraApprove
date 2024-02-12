import {Module} from "@nestjs/common"
import {ServiceModule} from "@libs/service/service.module"
import {SourceCodeController} from "./controller/source-code.controller"
import {PlanController} from "./controller/plan.controller"

@Module({
  imports: [ServiceModule],
  controllers: [SourceCodeController, PlanController],
  providers: []
})
export class AppModule {}
