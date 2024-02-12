import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res
} from "@nestjs/common"
import {PlanService} from "@libs/service"
import {Response} from "express"
import {Either, isLeft} from "fp-ts/lib/Either"
import {BadRequestResponseBody} from "./shared/error-model"
import {CreatePlanRefRequestBody} from "./plan-models"

@Controller()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post("/plan-refs")
  @HttpCode(HttpStatus.CREATED)
  async createPlanRef(
    @Body() requestBody: CreatePlanRefRequestBody,
    @Res({passthrough: true}) response: Response
  ): Promise<void> {
    const eitherPlan = await this.planService.createPlanRef(requestBody)

    if (isLeft(eitherPlan)) {
      const response = generateErrorResponse(eitherPlan.left)

      throw new BadRequestException(response)
    }

    const Plan = eitherPlan.right
    const location = `${response.req.protocol}://${response.req.headers.host}${response.req.url}/${Plan.id}`
    response.setHeader("Location", location)
  }
}

type ExtractPromise<T> = T extends Promise<infer U> ? U : T

type ExtractLeft<T> = ExtractPromise<T> extends Either<infer L, unknown>
  ? L
  : never

type CreatePlanErrors = ExtractLeft<ReturnType<PlanService["createPlanRef"]>>

function generateErrorResponse(
  errorCode: CreatePlanErrors
): BadRequestResponseBody {
  const upperCaseErrorCode = errorCode.toUpperCase()
  let message = ""

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
