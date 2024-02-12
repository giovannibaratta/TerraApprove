import {CreatePlan, Plan} from "@libs/domain"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {either} from "fp-ts"
import {Either, isLeft} from "fp-ts/lib/Either"
import * as TE from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import {
  PLAN_REPOSITORY_TOKEN,
  PlanRepository
} from "./interfaces/plan.interfaces"
import {isValidS3Url} from "./shared/s3-urls"

@Injectable()
export class PlanService {
  constructor(
    @Inject(PLAN_REPOSITORY_TOKEN)
    private readonly planRepo: PlanRepository
  ) {}

  async createPlanRef(
    request: CreatePlan
  ): Promise<Either<"credentials_detected" | "invalid_protocol", Plan>> {
    // Wrap in a lambda to preserve the "this" context
    const persistPlan = (req: CreatePlan) => this.planRepo.createPlan(req)

    const result = await pipe(
      request,
      validateRequest,
      TE.fromEither,
      TE.chainW(persistPlan),
      TE.chainW(logCreateResult)
    )()

    return result
  }
}

const validateRequest = (
  request: CreatePlan
): Either<"credentials_detected" | "invalid_protocol", CreatePlan> => {
  const isValidUrl = isValidS3Url(request.s3.url)

  return isLeft(isValidUrl) ? isValidUrl : either.right(request)
}

const logCreateResult = (result: Plan) => {
  Logger.log(`Created plan with id: ${result.id}`)
  return TE.right(result)
}
