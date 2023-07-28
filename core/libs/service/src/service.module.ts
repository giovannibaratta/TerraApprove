import {Module} from "@nestjs/common"
import {ApprovalService} from "./approval/approval.service"
import {FileHandler} from "./file-handler/file-handler"
import {PlanReaderService} from "./plan-reader/plan-reader.service"
import {ExternalModule} from "@libs/external/external.module"

@Module({
  imports: [ExternalModule],
  providers: [ApprovalService, FileHandler, PlanReaderService],
  exports: [ApprovalService, PlanReaderService]
})
export class ServiceModule {}
