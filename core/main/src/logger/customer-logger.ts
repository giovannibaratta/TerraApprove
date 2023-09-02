import {ConsoleLogger, LogLevel} from "@nestjs/common"

const NEST_COMPONENTS_TO_SUPPRESSS = ["InstanceLoader", "NestFactory"]

export class CustomLogger extends ConsoleLogger {
  private isDebugMode = false
  private printTimestamp = false

  constructor(options?: CustomLoggerOptions) {
    super("", {
      timestamp: true
    })

    this.isDebugMode = options?.debug ?? false
    this.printTimestamp = options?.timestamp ?? false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(message: unknown, stack?: string, _context?: string) {
    if (stack && NEST_COMPONENTS_TO_SUPPRESSS.includes(stack)) {
      // Suppress the message
      return
    }
    super.log(message)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(message: unknown, _context?: unknown, ..._rest: unknown[]): void {
    if (this.isDebugMode) {
      super.debug(message)
    }
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
    const timestmap = this.printTimestamp ? `${this.getTimestamp()} ` : ""
    const optionalTimestampDiff =
      logLevel === "debug" && this.printTimestamp ? `${timestampDiff} ` : ""
    return `${timestmap}${optionalTimestampDiff}${message}\n`
  }
}

export interface CustomLoggerOptions {
  debug?: boolean
  timestamp?: boolean
}
