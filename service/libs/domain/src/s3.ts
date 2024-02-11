export interface S3Reference {
  url: string
}

export function doesUrlIncludeCredentials(urlToValidate: string): boolean {
  const url = new URL(urlToValidate)
  return url.username !== "" || url.password !== ""
}

export function isHttpOrHttpsProtocol(urlToValidate: string): boolean {
  const url = new URL(urlToValidate)
  return url.protocol === "http:" || url.protocol === "https:"
}
