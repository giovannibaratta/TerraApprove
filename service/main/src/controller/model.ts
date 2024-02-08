import {operations} from "@apis/apis"

type SourceCoreRefRequestBody =
  operations["createSourceCodeRef"]["requestBody"]["content"]["application/json"]

export class CreateSourceCodeRefRequestBody
  implements SourceCoreRefRequestBody
{
  s3!: {
    url: string
  }
}

export type SourceCoreRefResponseBody =
  operations["createSourceCodeRef"]["responses"]["201"]["content"]["application/json"]

