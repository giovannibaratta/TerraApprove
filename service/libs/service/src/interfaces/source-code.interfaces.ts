import {CreateSourceCode, SourceCode} from "@libs/domain"

export const SOURCE_CODE_REPOSITORY_TOKEN = "SOURCE_CODE_REPOSITORY_TOKEN"
export interface SourceCodeRepository {
  createSourceCode: (request: CreateSourceCode) => Promise<SourceCode>
}
