import {RunService} from "@libs/service/run.service"
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Res
} from "@nestjs/common"
import {CreateRunRequestBody} from "./run-models"
import {isLeft} from "fp-ts/lib/Either"
import {Response} from "express"

@Controller("/runs")
export class RunController {
  constructor(private readonly runService: RunService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRun(
    @Body() requestBody: CreateRunRequestBody,
    @Res({passthrough: true}) response: Response
  ): Promise<void> {
    const eitherRun = await this.runService.createRun({
      planId: requestBody.plan_id,
      sourceCodeId: requestBody.source_code_id
    })

    if (isLeft(eitherRun)) {
      throw new InternalServerErrorException()
    }

    const run = eitherRun.right
    const location = `${response.req.protocol}://${response.req.headers.host}${response.req.url}/${run}`
    response.setHeader("Location", location)
  }
}
