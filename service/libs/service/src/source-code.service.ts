import {CreateSourceCode, SourceCode} from "@libs/domain"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {either} from "fp-ts"
import {Either} from "fp-ts/lib/Either"
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
    const isValidUrl = isValidS3Url(request.s3.url)

    if (either.isLeft(isValidUrl)) {
      return either.left(isValidUrl.left)
    }
    return this.sourceCodeRepo.createSourceCode(request).then(sourceCode => {
      Logger.log(`Created source code with id: ${sourceCode.id}`)
      return either.right(sourceCode)
    })
  }
}
