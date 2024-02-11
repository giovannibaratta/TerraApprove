import {Module} from "@nestjs/common"
import {ServiceModule} from "@libs/service/service.module"
import {SourceCodeController} from "./controller/source-code.controller"

@Module({
  imports: [ServiceModule],
  controllers: [SourceCodeController],
  providers: []
})
export class AppModule {}
