export interface S3SourceCode {
  id: string
  url: string
}

export type SourceCode = S3SourceCode

export interface CreateSourceCode {
  s3: {
    url: string
  }
}
