import {ApprovalService} from "@libs/service/approval/approval.service"
import {Logger} from "@nestjs/common"
import {CustomLogger} from "main/src/logger/customer-logger"
import {Command, CommandRunner, Option} from "nest-commander"

@Command({
  name: "ApprovalCommand",
  description:
    "Verify if approval is needed for the given code based and the given plan",
  arguments: "<codeBaseDir> <terraformPlanFile>",
  options: {
    isDefault: true
  }
})
export class ApprovalCommand extends CommandRunner {
  constructor(private readonly approvalSerivce: ApprovalService) {
    super()
  }

  async run(passedParameter: string[]): Promise<void> {
    if (passedParameter.length !== 2) {
      throw new Error("Invalid number of arguments")
    }

    const codeBaseDir = passedParameter[0]
    const terraformPlanFile = passedParameter[1]

    const approvalNeeded = await this.approvalSerivce.isApprovalRequired(
      codeBaseDir,
      terraformPlanFile
    )

    Logger.log(`Approval required: ${approvalNeeded}`)

    if (approvalNeeded) {
      this.command.error("", {
        exitCode: 1
      })
    }
  }

  @Option({
    flags: "-d, --debug",
    description: "Enable debug mode"
  })
  enableDebugMode() {
    Logger.overrideLogger(
      new CustomLogger({
        debug: true
      })
    )
  }
}
