import {either} from "fp-ts"
import {Either} from "fp-ts/lib/Either"
import {readFileSync} from "fs"

export function readFile(
  fileLocation: string
): Either<"resource_not_found", string> {
  let fileContent: string

  try {
    fileContent = readFileSync(fileLocation, "utf8")
  } catch (e) {
    return either.left("resource_not_found")
  }

  return either.right(fileContent)
}
