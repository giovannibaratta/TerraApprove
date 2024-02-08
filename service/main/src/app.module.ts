import {Module} from "@nestjs/common"
import {AppController} from "./app.controller"
import {ServiceModule} from "@libs/service/service.module"
import {SourceCodeController} from "./controller/source-code.controller"

@Module({
  imports: [ServiceModule],
  controllers: [AppController, SourceCodeController],
  providers: []
})
export class AppModule {}
