import {CreatePlan, Plan} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export const PLAN_REPOSITORY_TOKEN = "PLAN_REPOSITORY_TOKEN"
export interface PlanRepository {
  createPlan: (request: CreatePlan) => TaskEither<never, Plan>
}
