import {Module} from "@nestjs/common"
import {ServiceModule} from "@libs/service/service.module"
import {SourceCodeController} from "./controller/source-code.controller"
import {PlanController} from "./controller/plan.controller"
import {KafkaController} from "./controller/KafkaController"

@Module({
  imports: [ServiceModule],
  controllers: [SourceCodeController, PlanController, KafkaController],
  providers: []
})
export class AppModule {}
