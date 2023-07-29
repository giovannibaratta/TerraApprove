import {FileHandler} from "@libs/service/file-handler/file-handler"
import {ToInterface} from "@libs/testing/class-to-interface"
import {rejectPromiseMock} from "@libs/testing/mock-functions"
import {Injectable} from "@nestjs/common"

@Injectable()
export class FileHandlerMock implements ToInterface<FileHandler> {
  getTerraformFilesInFolder = rejectPromiseMock()
}
