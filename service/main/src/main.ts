import {NestFactory} from "@nestjs/core"
import {AppModule} from "./app.module"
import {globalValidationPipe} from "./validation-pipe"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(globalValidationPipe)
  await app.listen(3000)
}

bootstrap()
