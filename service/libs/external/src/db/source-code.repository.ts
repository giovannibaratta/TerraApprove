import {CreateSourceCode, S3SourceCode} from "@libs/domain"
import {SourceCodeRepository} from "@libs/service/interfaces/source-code.interfaces"
import {Injectable} from "@nestjs/common"
import {DatabaseClient} from "./database-client"
import {randomUUID} from "crypto"

@Injectable()
export class SourceCodeDbRepository implements SourceCodeRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  async createSourceCode(request: CreateSourceCode): Promise<S3SourceCode> {
    const dbOject = await this.dbClient.sourceCode.create({
      data: {
        createdAt: new Date(),
        reference: request.s3.url,
        type: "S3",
        id: randomUUID()
      }
    })

    return {
      id: dbOject.id,
      url: dbOject.reference
    }
  }
}
