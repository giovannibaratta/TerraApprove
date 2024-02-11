import {S3Reference} from "./s3"

export interface S3SourceCode extends S3Reference {
  id: string
}

export type SourceCode = S3SourceCode

export interface CreateSourceCode {
  s3: S3Reference
}
