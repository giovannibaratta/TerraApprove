import {RequireApprovalModeUseCase} from "@libs/service/approval/require-approval-mode.use-case"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class RequireApprovalModeUseCaseMock
  implements ToInterface<RequireApprovalModeUseCase>
{
  isApprovalRequired = rejectPromiseMock()
}
