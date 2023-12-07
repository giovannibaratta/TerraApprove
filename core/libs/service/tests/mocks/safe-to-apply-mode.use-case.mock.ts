import {SafeToApplyModeUseCase} from "@libs/service/approval/safe-to-apply-mode.use-case"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class SafeToApplyModeUseCaseMock
  implements ToInterface<SafeToApplyModeUseCase>
{
  isApprovalRequired = rejectPromiseMock()
}
