import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res
} from "@nestjs/common"
import {CreateSourceCodeRefRequestBody} from "./model"
import {SourceCodeService} from "@libs/service"
import {Response} from "express"
import {Either, isLeft} from "fp-ts/lib/Either"
import {BadRequestResponseBody} from "./shared/error-model"

@Controller()
export class SourceCodeController {
  constructor(private readonly sourceCodeService: SourceCodeService) {}

  @Post("/source-code-refs")
  @HttpCode(HttpStatus.CREATED)
  async createSourceCodeRef(
    @Body() requestBody: CreateSourceCodeRefRequestBody,
    @Res({passthrough: true}) response: Response
  ): Promise<void> {
    const eitherSourceCode = await this.sourceCodeService.createSourceCodeRef(
      requestBody
    )

    if (isLeft(eitherSourceCode)) {
      const response = generateErrorResponse(eitherSourceCode.left)

      throw new BadRequestException(response)
    }

    const sourceCode = eitherSourceCode.right
    const location = `${response.req.protocol}://${response.req.headers.host}${response.req.url}/${sourceCode.id}`
    response.setHeader("Location", location)
  }
}

type ExtractPromise<T> = T extends Promise<infer U> ? U : T

type ExtractLeft<T> = ExtractPromise<T> extends Either<infer L, unknown>
  ? L
  : never

type CreateSourceCodeErrors = ExtractLeft<
  ReturnType<SourceCodeService["createSourceCodeRef"]>
>

function generateErrorResponse(
  errorCode: CreateSourceCodeErrors
): BadRequestResponseBody {
  const upperCaseErrorCode = errorCode.toUpperCase()
  let message: string

  switch (errorCode) {
    case "credentials_detected":
      message = "The provided URL contains credentials"
      break
    case "invalid_protocol":
      message = "The provided URL has an invalid protocol"
      break
  }

  return {
    errors: [
      {
        code: upperCaseErrorCode,
        message
      }
    ]
  }
}
