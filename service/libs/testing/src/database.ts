import {PrismaClient} from "@prisma/client"

export async function cleanDatabase(client: PrismaClient): Promise<void> {
  await client.sourceCode.deleteMany()
  await client.plan.deleteMany()
}
