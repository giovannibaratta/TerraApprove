import {S3Reference} from "./s3"

export interface S3Plan extends S3Reference {
  id: string
}

export type Plan = S3Plan

export interface CreatePlan {
  s3: S3Reference
}
