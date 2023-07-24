import {readFileSync, readdirSync, statSync} from "fs"
import {File} from "../../domain/file/file"
import {Either, isLeft} from "fp-ts/lib/Either"
import {either} from "fp-ts"

type FileError = "not_a_directory" | "directory_not_found"

export class FileHandler {
  constructor() {}

  private listFilesInFolder(folder: string): Either<FileError, string[]> {
    const stats = statSync(folder, {
      throwIfNoEntry: false
    })

    if (stats === undefined) {
      return either.left("directory_not_found")
    }

    if (stats.isDirectory() === false) {
      return either.left("not_a_directory")
    }

    return either.right(readdirSync(folder))
  }

  private listTerraformFilesInFolder(
    folder: string
  ): Either<FileError, string[]> {
    const eitherFiles = this.listFilesInFolder(folder)

    if (isLeft(eitherFiles)) {
      return eitherFiles
    }

    const files = eitherFiles.right

    return either.right(files.filter(file => file.endsWith(".tf")))
  }

  private readFileAndSplitLines(filePath: string): string[] {
    const content = readFileSync(filePath, "utf8")
    return content.split("\n")
  }

  getTerraformFilesInFolder(folder: string): Either<FileError, File[]> {
    const eitherFiles = this.listTerraformFilesInFolder(folder)

    if (isLeft(eitherFiles)) {
      return eitherFiles
    }

    const files = eitherFiles.right

    return either.right(
      files.map(file => {
        const content = this.readFileAndSplitLines(`${folder}/${file}`)
        return {
          name: file,
          lines: content
        }
      })
    )
  }
}
