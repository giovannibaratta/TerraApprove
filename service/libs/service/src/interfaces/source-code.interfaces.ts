import {CreateSourceCode, SourceCode} from "@libs/domain"
import {TaskEither} from "fp-ts/lib/TaskEither"

export const SOURCE_CODE_REPOSITORY_TOKEN = "SOURCE_CODE_REPOSITORY_TOKEN"
export interface SourceCodeRepository {
  createSourceCode: (request: CreateSourceCode) => TaskEither<never, SourceCode>
}
