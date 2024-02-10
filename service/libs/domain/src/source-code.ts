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

export function doesUrlIncludeCredentials(urlToValidate: string): boolean {
  const url = new URL(urlToValidate)
  return url.username !== "" || url.password !== ""
}
