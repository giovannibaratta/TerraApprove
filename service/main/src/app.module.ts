import {Module} from "@nestjs/common"
import {AppController} from "./app.controller"
import {ServiceModule} from "@libs/service/service.module"

@Module({
  imports: [ServiceModule],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
