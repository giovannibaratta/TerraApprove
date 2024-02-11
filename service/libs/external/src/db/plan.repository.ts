import {CreatePlan, Plan} from "@libs/domain"
import {Injectable, Logger} from "@nestjs/common"
import {DatabaseClient} from "./database-client"
import {randomUUID} from "crypto"
import {PlanRepository} from "@libs/service/interfaces/plan.interfaces"
import {Plan as PrismaPlan} from "@prisma/client"
import * as TE from "fp-ts/lib/TaskEither"
import {TaskEither} from "fp-ts/lib/TaskEither"
import {pipe} from "fp-ts/lib/function"

@Injectable()
export class PlanDbRepository implements PlanRepository {
  constructor(private readonly dbClient: DatabaseClient) {}

  createPlan(request: CreatePlan): TaskEither<never, Plan> {
    const result = pipe(
      request,
      TE.right,
      TE.chainW(this.persistObjectTask()),
      TE.map(mapToDomain)
    )

    return result
  }

  private persistObjectTask(): (
    request: CreatePlan
  ) => TaskEither<never, PrismaPlan> {
    // Wrap in a lambda to preserve the "this" context
    return request =>
      TE.tryCatchK(
        () =>
          this.dbClient.plan.create({
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

function mapToDomain(dbObject: PrismaPlan): Plan {
  return {
    id: dbObject.id,
    url: dbObject.reference
  }
}
