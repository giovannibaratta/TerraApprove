import {PrismaClient, SourceCode} from "@prisma/client"
// eslint-disable-next-line node/no-unpublished-import
import {Chance} from "chance"

const random = new Chance()

export async function persistSourceCodeMock(
  prisma: PrismaClient,
  override?: Partial<SourceCode>
): Promise<SourceCode> {
  const data: SourceCode = {
    createdAt: random.date(),
    id: random.guid(),
    type: "S3",
    reference: random.url(),
    ...override
  }

  const result = await prisma.sourceCode.create({
    data
  })

  return result
}
