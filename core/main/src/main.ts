import {CommandFactory} from "nest-commander"
import {CommandModule} from "./command/command.module"
import {CustomLogger} from "./logger/customer-logger"

async function bootstrap() {
  await CommandFactory.run(CommandModule, new CustomLogger())
}

bootstrap()
