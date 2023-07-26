import {Module} from "@nestjs/common"
import {ApprovalCommand} from "./approval/approval.command"
import {ServiceModule} from "@libs/service/service.module"

@Module({
  imports: [ServiceModule],
  providers: [ApprovalCommand]
})
export class CommandModule {}
