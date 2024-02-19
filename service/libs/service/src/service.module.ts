import {Module} from "@nestjs/common"
import {SourceCodeService} from "./source-code.service"
import {ExternalModule} from "@libs/external/external.module"
import {PlanService} from "./plan.service"
import {RunService} from "./run.service"

@Module({
  imports: [ExternalModule],
  providers: [SourceCodeService, PlanService, RunService],
  exports: [SourceCodeService, PlanService, RunService]
})
export class ServiceModule {}
