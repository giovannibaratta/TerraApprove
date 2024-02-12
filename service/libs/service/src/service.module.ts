import {Module} from "@nestjs/common"
import {SourceCodeService} from "./source-code.service"
import {ExternalModule} from "@libs/external/external.module"
import {PlanService} from "./plan.service"

@Module({
  imports: [ExternalModule],
  providers: [SourceCodeService, PlanService],
  exports: [SourceCodeService, PlanService]
})
export class ServiceModule {}
