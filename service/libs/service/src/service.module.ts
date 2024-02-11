import {Module} from "@nestjs/common"
import {SourceCodeService} from "./source-code.service"
import {ExternalModule} from "@libs/external/external.module"

@Module({
  imports: [ExternalModule],
  providers: [SourceCodeService],
  exports: [SourceCodeService]
})
export class ServiceModule {}
