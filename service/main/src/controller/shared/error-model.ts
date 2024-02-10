import {operations} from "@apis/apis"

type CreateSourceCodeBadRequestResponseBody =
  operations["createSourceCodeRef"]["responses"]["400"]["content"]["application/json"]

export interface BadRequestResponseBody
  extends CreateSourceCodeBadRequestResponseBody {}
