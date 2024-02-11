import {
  CreateSourceCode,
  SourceCode,
  doesUrlIncludeCredentials,
  isHttpOrHttpsProtocol
} from "@libs/domain"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {
  SOURCE_CODE_REPOSITORY_TOKEN,
  SourceCodeRepository
} from "./interfaces/source-code.interfaces"
import {either} from "fp-ts"
import {Either} from "fp-ts/lib/Either"

@Injectable()
export class SourceCodeService {
  constructor(
    @Inject(SOURCE_CODE_REPOSITORY_TOKEN)
    private readonly sourceCodeRepo: SourceCodeRepository
  ) {}

  async createSourceCodeRef(
    request: CreateSourceCode
  ): Promise<Either<"credentials_detected" | "invalid_protocol", SourceCode>> {
    if (!isHttpOrHttpsProtocol(request.s3.url)) {
      return either.left("invalid_protocol")
    }

    if (doesUrlIncludeCredentials(request.s3.url)) {
      return either.left("credentials_detected")
    }

    return this.sourceCodeRepo.createSourceCode(request).then(sourceCode => {
      Logger.log(`Created source code with id: ${sourceCode.id}`)
      return either.right(sourceCode)
    })
  }
}
