import {Logger} from "@nestjs/common"
import {either} from "fp-ts"
import {Either} from "fp-ts/lib/Either"
import {readFileSync} from "fs"
import {parse} from "yaml"

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

export function yamlToJson(
  content: string
): Either<"invalid_resource", object> {
  let jsonContent: unknown

  try {
    jsonContent = parse(content, {
      strict: true,
      uniqueKeys: true
    })
  } catch (e) {
    Logger.error(e)
    return either.left("invalid_resource")
  }

  // If content is empty, the parser return null
  // In this case we map it to an empty object
  if (jsonContent === null) return either.right({})

  if (typeof jsonContent !== "object") return either.left("invalid_resource")

  return either.right(jsonContent)
}
