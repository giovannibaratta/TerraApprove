import {ExternalModule} from "@libs/external/external.module"
import {Module} from "@nestjs/common"
import {ApprovalService} from "./approval/approval.service"
import {BootstrappingService} from "./bootstrapping/bootstrapping.service"
import {CodebaseReaderService} from "./codebase-reader/codebase-reader.service"
import {ConfigurationService} from "./configuration/configuration.service"
import {PlanReaderService} from "./plan-reader/plan-reader.service"

@Module({
  imports: [ExternalModule],
  providers: [
    ApprovalService,
    CodebaseReaderService,
    PlanReaderService,
    ConfigurationService,
    BootstrappingService
  ],
  exports: [ApprovalService, BootstrappingService]
})
export class ServiceModule {}
