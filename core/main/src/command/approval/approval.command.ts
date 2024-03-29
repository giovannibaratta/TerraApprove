import {CustomLoggerOptions, CustomLogger} from "@app/logger/customer-logger"
import {ApprovalService} from "@libs/service/approval/approval.service"
import {BootstrappingService} from "@libs/service/bootstrapping/bootstrapping.service"
import {Logger} from "@nestjs/common"
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

  private operationMode: "standard" | "reverse" = "standard"

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

    try {
      const codeBaseDir = passedParameter[0]
      const terraformPlanFile = passedParameter[1]

      this.bootstrappingService.setTerraformCodeBaseLocation(codeBaseDir)
      this.bootstrappingService.setTerraformPlanLocation(terraformPlanFile)

      // For now we support only configuration defined in this hardcoded file.
      // In the future the configuration could be passed using a command line parameter
      this.bootstrappingService.setConfigurationLocation(
        `${codeBaseDir}/.terraapprove.yaml`
      )

      Logger.log(`Operating mode: ${this.operationMode}`)

      const approvalNeeded = await this.approvalSerivce.isApprovalRequired({
        mode:
          this.operationMode === "standard"
            ? "require_approval"
            : "safe_to_apply"
      })

      Logger.log(`Approval required: ${approvalNeeded}`)

      if (approvalNeeded) {
        this.command.error("", {
          exitCode: 1
        })
      }
    } catch (_) {
      this.command.error("", {
        exitCode: 2
      })
    }
  }

  @Option({
    flags: "--standard",
    description:
      "Use the standard mode (detect RequireApproval decorator). This is the default mode."
  })
  enableStandardMode() {
    this.operationMode = "standard"
  }

  @Option({
    flags: "--reverse",
    description: "Use the reverse mode (detect SafeToApply decorator)"
  })
  enableReverseMode() {
    this.operationMode = "reverse"
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
