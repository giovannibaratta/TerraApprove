import {Plan, PrismaClient} from "@prisma/client"
// eslint-disable-next-line node/no-unpublished-import
import {Chance} from "chance"

const random = new Chance()

export async function persistPlanMock(
  prisma: PrismaClient,
  override?: Partial<Plan>
): Promise<Plan> {
  const data: Plan = {
    createdAt: random.date(),
    id: random.guid(),
    type: "S3",
    reference: random.url(),
    ...override
  }

  const result = await prisma.plan.create({
    data
  })

  return result
}
