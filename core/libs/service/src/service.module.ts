import {ExternalModule} from "@libs/external/external.module"
import {Module} from "@nestjs/common"
import {ApprovalService} from "./approval/approval.service"
import {BootstrappingService} from "./bootstrapping/bootstrapping.service"
import {CodebaseReaderService} from "./codebase-reader/codebase-reader.service"
import {ConfigurationService} from "./configuration/configuration.service"
import {PlanReaderService} from "./plan-reader/plan-reader.service"
import {RequireApprovalModeUseCase} from "./approval/require-approval-mode.use-case"
import {SafeToApplyModeUseCase} from "./approval/safe-to-apply-mode.use-case"

@Module({
  imports: [ExternalModule],
  providers: [
    ApprovalService,
    CodebaseReaderService,
    PlanReaderService,
    ConfigurationService,
    BootstrappingService,
    RequireApprovalModeUseCase,
    SafeToApplyModeUseCase
  ],
  exports: [ApprovalService, BootstrappingService]
})
export class ServiceModule {}
