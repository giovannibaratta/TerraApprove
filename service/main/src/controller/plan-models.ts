import {operations} from "@apis/apis"

type PlanRefRequestBody =
  operations["createPlanRef"]["requestBody"]["content"]["application/json"]

export class CreatePlanRefRequestBody implements PlanRefRequestBody {
  s3!: {
    url: string
  }
}

export type PlanRefResponseBody =
  operations["createPlanRef"]["responses"]["201"]["content"]["application/json"]
