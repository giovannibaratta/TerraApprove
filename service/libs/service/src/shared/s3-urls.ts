import {doesUrlIncludeCredentials, isHttpOrHttpsProtocol} from "@libs/domain"
import {either} from "fp-ts"
import {Either} from "fp-ts/lib/Either"

export function isValidS3Url(
  urlToValidate: string
): Either<"credentials_detected" | "invalid_protocol", string> {
  if (!isHttpOrHttpsProtocol(urlToValidate)) {
    return either.left("invalid_protocol")
  }

  if (doesUrlIncludeCredentials(urlToValidate)) {
    return either.left("credentials_detected")
  }

  return either.right(urlToValidate)
}
