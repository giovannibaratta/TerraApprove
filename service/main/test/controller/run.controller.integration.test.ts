import {AppModule} from "@app/app.module"
import {CreateRunRequestBody} from "@app/controller/run-models"
import {Config, KafkaConfig} from "@libs/external/config/config"
import {DatabaseClient} from "@libs/external/db/database-client"
import {cleanDatabase, prepareDatabase} from "@libs/testing/database"
import {persistPlanMock} from "@libs/testing"
import {persistSourceCodeMock} from "@libs/testing"
import {NestApplication} from "@nestjs/core"
import {TestingModule, Test} from "@nestjs/testing"
import {PrismaClient} from "@prisma/client"
// eslint-disable-next-line node/no-unpublished-import
import * as request from "supertest"
import "expect-more-jest"
import {randomUUID} from "crypto"
import {globalValidationPipe} from "@app/validation-pipe"
import {
  cleanKafka,
  prepareKafka,
  readMessagesFromKafka
} from "@libs/testing/kafka"

describe("POST /runs", () => {
  let app: NestApplication
  let prisma: PrismaClient
  let kafkaConfig: KafkaConfig

  const endpoint = "/runs"

  beforeAll(async () => {
    const isolatedDb = await prepareDatabase()
    kafkaConfig = await prepareKafka()

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(Config)
      .useValue({
        getDbConnectionUrl: () => isolatedDb,
        kafkaConfig
      })
      .compile()
    app = module.createNestApplication()
    app.useGlobalPipes(globalValidationPipe)
    await app.init()

    prisma = module.get(DatabaseClient)
  })

  beforeEach(async () => {
    await cleanKafka(kafkaConfig)
    await cleanDatabase(prisma)
  })

  it("should persist the run, emit a run-status-changed event and return the uuid", async () => {
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

    // Validate events
    const messages = await readMessagesFromKafka(
      kafkaConfig,
      kafkaConfig.topics.runStatusChanged
    )

    expect(messages).toBeArrayOfSize(1)
    expect(JSON.parse(messages[0] ?? "")).toMatchObject({
      id: responseUuid,
      state: "pending_validation"
    })

    // Validate database
    const run = await prisma.run.findUnique({
      where: {
        id: responseUuid
      }
    })

    expect(run).toBeDefined()
    expect(run?.planId).toBe(requestBody.plan_id)
    expect(run?.sourceCodeId).toBe(requestBody.source_code_id)
  }, 10000)

  it("should return 400 if the plan_id is not a valid uuid", async () => {
    // Given
    const requestBody: CreateRunRequestBody = {
      plan_id: "not-a-uuid",
      source_code_id: randomUUID()
    }

    // When
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .send(requestBody)

    // Expect
    expect(response.body.errors).toBeArrayOf({
      code: expect.toBeString(),
      message: expect.toBeString()
    })
    expect(
      response.body.errors.map(
        (it: {code: string; message: string}) => it.message
      )
    ).toBeArrayIncludingAllOf(["plan_id must be a UUID"])
    expect(response.status).toBe(400)
  })

  it("should return 400 if the source_code_id is not a valid uuid", async () => {
    // Given
    const requestBody: CreateRunRequestBody = {
      plan_id: "not-a-uuid",
      source_code_id: "not-a-uuid"
    }

    // When
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .send(requestBody)

    // Expect
    expect(response.body.errors).toBeArrayOf({
      code: expect.toBeString(),
      message: expect.toBeString()
    })
    expect(
      response.body.errors.map(
        (it: {code: string; message: string}) => it.message
      )
    ).toBeArrayIncludingAllOf(["source_code_id must be a UUID"])
    expect(response.status).toBe(400)
  })

  afterAll(async () => {
    await cleanKafka(kafkaConfig)
    await cleanDatabase(prisma)
    await prisma.$disconnect()
    await app.close()
  })
})
