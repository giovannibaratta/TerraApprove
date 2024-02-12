import {CreateSourceCode, SourceCode} from "@libs/domain"
import {SourceCodeRepository} from "@libs/service/interfaces/source-code.interfaces"
import {Injectable, Logger} from "@nestjs/common"
import {SourceCode as PrismaSourceCode} from "@prisma/client"
import {randomUUID} from "crypto"
import * as TE from "fp-ts/lib/TaskEither"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"
import {DatabaseClient} from "./database-client"

@Injectable()
export class SourceCodeDbRepository implements SourceCodeRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  createSourceCode(request: CreateSourceCode): TaskEither<never, SourceCode> {
    const result = pipe(
      request,
      TE.right,
      TE.chainW(this.persistObjectTask()),
      TE.map(mapToDomain)
    )

    return result
  }

  private persistObjectTask(): (
    request: CreateSourceCode
  ) => TaskEither<never, PrismaSourceCode> {
    // Wrap in a lambda to preserve the "this" context
    return request =>
      TE.tryCatchK(
        () =>
          this.dbClient.sourceCode.create({
            data: {
              createdAt: new Date(),
              reference: request.s3.url,
              type: "S3",
              id: randomUUID()
            }
          }),
        error => {
          Logger.error("Error while creating source code")
          throw error
        }
      )()
  }
}

function mapToDomain(dbObject: PrismaSourceCode): SourceCode {
  return {
    id: dbObject.id,
    url: dbObject.reference
  }
}
