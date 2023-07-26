import {Injectable} from "@nestjs/common"
import {FileHandler} from "../file-handler/file-handler"
import {isLeft} from "fp-ts/lib/Either"
import {findTerraformResourcesInFile} from "@libs/domain/terraform/resource"

@Injectable()
export class ApprovalService {
  constructor(private readonly fileHandler: FileHandler) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isApprovalRequired(codeBaseDir: string, _planFile: string): boolean {
    const fileHandler = new FileHandler()

    const eitherFilesToParse =
      fileHandler.getTerraformFilesInFolder(codeBaseDir)

    if (isLeft(eitherFilesToParse)) {
      throw new Error(eitherFilesToParse.left)
    }

    const filesToParse = eitherFilesToParse.right

    filesToParse
      .map(file => {
        return findTerraformResourcesInFile(file)
      })
      .flat()

    return true
  }
}
