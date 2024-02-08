import {Body, Controller, HttpCode, Post, Res} from "@nestjs/common"
import {CreateSourceCodeRefRequestBody} from "./model"
import {SourceCodeService} from "@libs/service"
export {Response} from "express"

@Controller()
export class SourceCodeController {
  constructor(private readonly sourceCodeService: SourceCodeService) {}

  @Post("/source-code-refs")
  @HttpCode(204)
  async createSourceCodeRef(
    @Body() requestBody: CreateSourceCodeRefRequestBody,
    @Res() response: Response
  ): Promise<void> {
    const sourceCode = await this.sourceCodeService.createSourceCodeRef(
      requestBody
    )
    response.headers.set("Location", `/source-code-ref/${sourceCode.id}`)
  }
}
