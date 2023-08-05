import {CodebaseReaderService} from "@libs/service/codebase-reader/codebase-reader.service"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class CodebaseReaderServiceMock
  implements ToInterface<CodebaseReaderService>
{
  getTerraformFilesInFolder = rejectPromiseMock()
}
