import {ApprovalService} from "@libs/service/approval/approval.service"
import {BootstrappingService} from "@libs/service/bootstrapping/bootstrapping.service"
import {Logger} from "@nestjs/common"
import {
  CustomLogger,
  CustomLoggerOptions
} from "main/src/logger/customer-logger"
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
  private loggerDefaultConfig: CustomLoggerOptions = {
    debug: false,
    timestamp: false
  }

  constructor(
    private readonly bootstrappingService: BootstrappingService,
    private readonly approvalSerivce: ApprovalService
  ) {
    super()
  }

  async run(passedParameter: string[]): Promise<void> {
    this.overrideLogger()

    if (passedParameter.length !== 2) {
      throw new Error("Invalid number of arguments")
    }

    const codeBaseDir = passedParameter[0]
    const terraformPlanFile = passedParameter[1]

    this.bootstrappingService.setTerraformCodeBaseLocation(codeBaseDir)
    this.bootstrappingService.setTerraformPlanLocation(terraformPlanFile)

    // For now we support only configuration defined in this hardcoded file.
    // In the future the configuration could be passed using a command line parameter
    this.bootstrappingService.setConfigurationLocation("./.terraapprove.yaml")

    await this.bootstrappingService.bootstrap()

    const approvalNeeded = await this.approvalSerivce.isApprovalRequired()

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
    this.loggerDefaultConfig.debug = true
  }

  @Option({
    flags: "--timestamp",
    description: "Print timestamp near messages"
  })
  enableTimestamps() {
    this.loggerDefaultConfig.timestamp = true
  }

  private overrideLogger() {
    Logger.overrideLogger(new CustomLogger(this.loggerDefaultConfig))
  }
}
