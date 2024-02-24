import {AppModule} from "@app/app.module"
import {CreateRunRequestBody} from "@app/controller/run-models"
import {Config} from "@libs/external/config/config"
import {DatabaseClient} from "@libs/external/db/database-client"
import {cleanDatabase, prepareDatabase} from "@libs/testing/database"
import {persistPlanMock} from "@libs/testing"
import {persistSourceCodeMock} from "@libs/testing"
import {NestApplication} from "@nestjs/core"
import {TestingModule, Test} from "@nestjs/testing"
import {PrismaClient} from "@prisma/client"

// eslint-disable-next-line node/no-unpublished-import
import * as request from "supertest"

describe("POST /runs", () => {
  let app: NestApplication
  let prisma: PrismaClient

  const endpoint = "/runs"

  beforeAll(async () => {
    const isolatedDb = await prepareDatabase()

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(Config)
      .useValue({
        getDbConnectionUrl: () => isolatedDb
      })
      .compile()

    app = module.createNestApplication()
    await app.init()

    prisma = module.get(DatabaseClient)
  })

  beforeEach(async () => {
    await cleanDatabase(prisma)
  })

  it("should create a record in the run table and return the uuid", async () => {
    // Given

    const sourceCode = await persistSourceCodeMock(prisma)
    const plan = await persistPlanMock(prisma)

    const requestBody: CreateRunRequestBody = {
      plan_id: plan.id,
      source_code_id: sourceCode.id
    }

    // When
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .send(requestBody)

    // Expect

    // Validate response
    expect(response.headers.location).toBeDefined()

    const responseUuid: string =
      response.headers.location?.split("/").reverse()[0] ?? ""

    // Validate database
    const run = await prisma.run.findUnique({
      where: {
        id: responseUuid
      }
    })

    expect(run).toBeDefined()
    expect(run?.planId).toBe(requestBody.plan_id)
    expect(run?.sourceCodeId).toBe(requestBody.source_code_id)
  })

  afterAll(async () => {
    await cleanDatabase(prisma)
    await prisma.$disconnect()
    await app.close()
  })
})
