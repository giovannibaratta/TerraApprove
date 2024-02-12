import {CreateSourceCode, SourceCode} from "@libs/domain"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {either} from "fp-ts"
import {Either, isLeft} from "fp-ts/lib/Either"
import * as TE from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import {
  SOURCE_CODE_REPOSITORY_TOKEN,
  SourceCodeRepository
} from "./interfaces/source-code.interfaces"
import {isValidS3Url} from "./shared/s3-urls"

@Injectable()
export class SourceCodeService {
  constructor(
    @Inject(SOURCE_CODE_REPOSITORY_TOKEN)
    private readonly sourceCodeRepo: SourceCodeRepository
  ) {}

  async createSourceCodeRef(
    request: CreateSourceCode
  ): Promise<Either<"credentials_detected" | "invalid_protocol", SourceCode>> {
    // Wrap in a lambda to preserve the "this" context
    const persistSourceCode = (req: CreateSourceCode) =>
      this.sourceCodeRepo.createSourceCode(req)

    const result = await pipe(
      request,
      validateRequest,
      TE.fromEither,
      TE.chainW(persistSourceCode),
      TE.chainW(logCreateResult)
    )()

    return result
  }
}

const validateRequest = (
  request: CreateSourceCode
): Either<"credentials_detected" | "invalid_protocol", CreateSourceCode> => {
  const isValidUrl = isValidS3Url(request.s3.url)

  return isLeft(isValidUrl) ? isValidUrl : either.right(request)
}

const logCreateResult = (result: SourceCode) => {
  Logger.log(`Created source code with id: ${result.id}`)
  return TE.right(result)
}
