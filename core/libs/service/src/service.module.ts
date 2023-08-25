import {Module} from "@nestjs/common"
import {ApprovalService} from "./approval/approval.service"
import {CodebaseReaderService} from "./codebase-reader/codebase-reader.service"
import {PlanReaderService} from "./plan-reader/plan-reader.service"
import {ExternalModule} from "@libs/external/external.module"
import {ConfigurationService} from "./configuration/configuration.service"

@Module({
  imports: [ExternalModule],
  providers: [
    ApprovalService,
    CodebaseReaderService,
    PlanReaderService,
    ConfigurationService
  ],
  exports: [ApprovalService, ConfigurationService]
})
export class ServiceModule {}
