import {ConsoleLogger, LogLevel} from "@nestjs/common"

const NEST_COMPONENTS_TO_SUPPRESSS = ["InstanceLoader", "NestFactory"]

export class CustomLogger extends ConsoleLogger {
  constructor() {
    super("", {
      timestamp: true
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(message: unknown, stack?: string, _context?: string) {
    if (stack && NEST_COMPONENTS_TO_SUPPRESSS.includes(stack)) {
      // Suppress the message
      return
    }
    super.log(message)
  }

  protected getTimestamp(): string {
    return new Date().toISOString()
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string
  ): string {
    const timestmap = this.getTimestamp()
    const optionalTimestampDiff = logLevel === "debug" ? timestampDiff : ""
    return `${timestmap} ${optionalTimestampDiff} ${message}\n`
  }
}
