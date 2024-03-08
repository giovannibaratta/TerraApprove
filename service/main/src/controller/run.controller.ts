import {RunService} from "@libs/service/run.service"
import {
  BadRequestException,
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
import {CreateRunError} from "@libs/service/interfaces/run.interfaces"
import {generateBadRequestResponse} from "./shared/error-model"

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

    if (isLeft(eitherRun)) handleCreateRunError(eitherRun.left)

    const run = eitherRun.right
    const location = `${response.req.protocol}://${response.req.headers.host}${response.req.url}/${run}`
    response.setHeader("Location", location)
  }
}

function handleCreateRunError(error: CreateRunError): never {
  switch (error) {
    case "plan_not_found":
      throw new BadRequestException(
        generateBadRequestResponse(error.toUpperCase(), "Plan not found")
      )

    case "source_code_not_found":
      throw new BadRequestException(
        generateBadRequestResponse(error.toUpperCase(), "Source code not found")
      )

    case "unknown_run_state":
      throw new InternalServerErrorException({
        message: "Unknown run state found in the persistence layer",
        error: error.toUpperCase()
      })
  }
}
