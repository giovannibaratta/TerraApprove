import {Module} from "@nestjs/common"
import {ApprovalService} from "./approval/approval.service"
import {FileHandler} from "./file-handler/file-handler"

@Module({
  providers: [ApprovalService, FileHandler],
  exports: [ApprovalService]
})
export class ServiceModule {}
