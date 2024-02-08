import {Body, Controller, HttpCode, HttpStatus, Post, Res} from "@nestjs/common"
import {CreateSourceCodeRefRequestBody} from "./model"
import {SourceCodeService} from "@libs/service"
import {Response} from "express"

@Controller()
export class SourceCodeController {
  constructor(private readonly sourceCodeService: SourceCodeService) {}

  @Post("/source-code-refs")
  @HttpCode(HttpStatus.CREATED)
  async createSourceCodeRef(
    @Body() requestBody: CreateSourceCodeRefRequestBody,
    @Res({passthrough: true}) response: Response
  ): Promise<void> {
    const sourceCode = await this.sourceCodeService.createSourceCodeRef(
      requestBody
    )

    const location = `${response.req.protocol}://${response.req.headers.host}${response.req.url}/${sourceCode.id}`
    response.setHeader("Location", location)
  }
}
