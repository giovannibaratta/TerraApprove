import {operations} from "@apis/apis"
import {IsUUID} from "class-validator"

type CreateRunRequestBodyType =
  operations["createRun"]["requestBody"]["content"]["application/json"]

export class CreateRunRequestBody implements CreateRunRequestBodyType {
  @IsUUID()
  readonly plan_id!: string
  @IsUUID()
  readonly source_code_id!: string
}
