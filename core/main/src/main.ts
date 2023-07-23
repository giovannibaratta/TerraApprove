import {readFileSync} from "fs"
import {findTerraformResourcesInFile} from "domain/terraform/resource"
import {Logger} from "tslog"

function readFileAndSplitLines(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8")
  return content.split("\n")
}

function main() {
  const logger = new Logger()
  const content = readFileAndSplitLines(process.argv[2])
  const resources = findTerraformResourcesInFile({
    name: process.argv[2],
    lines: content
  })
  logger.info(resources)
}

main()
