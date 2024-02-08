import {Module} from "@nestjs/common"
import {AppService} from "./app.service"
import {SourceCodeService} from "./source-code.service"
import {ExternalModule} from "@libs/external/external.module"

@Module({
  imports: [ExternalModule],
  providers: [AppService, SourceCodeService],
  exports: [AppService, SourceCodeService]
})
export class ServiceModule {}
