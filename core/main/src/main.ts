import {findTerraformResourcesInFile} from "domain/terraform/resource"
import {Logger} from "tslog"
import {FileHandler} from "../../libs/src/service/file-handler/file-handler"
import {isLeft} from "fp-ts/lib/Either"

function main() {
  const logger = new Logger()

  const fileHandler = new FileHandler()

  const eitherFilesToParse = fileHandler.getTerraformFilesInFolder(
    process.argv[2]
  )

  if (isLeft(eitherFilesToParse)) {
    throw new Error(eitherFilesToParse.left)
  }

  const filesToParse = eitherFilesToParse.right

  const terraformResources = filesToParse
    .map(file => {
      return findTerraformResourcesInFile(file)
    })
    .flat()

  logger.info(terraformResources)
}

main()
