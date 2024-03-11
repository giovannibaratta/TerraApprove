// eslint-disable-next-line node/no-unpublished-import
import {NestApplication} from "@nestjs/core"
import * as request from "supertest"
// eslint-disable-next-line node/no-unpublished-import
import {operations} from "@apis/apis"
import {AppModule} from "@app/app.module"
import {Config, KafkaConfig} from "@libs/external/config/config"
import {DatabaseClient} from "@libs/external/db/database-client"
import {prepareDatabase} from "@libs/testing/database"
import {generateIsolatedKafkaConfig} from "@libs/testing/kafka"
import {Test, TestingModule} from "@nestjs/testing"
import {PrismaClient} from "@prisma/client"

describe("POST /source-code-refs", () => {
  let kafkaConfig: KafkaConfig
  let app: NestApplication
  let prisma: PrismaClient

  beforeEach(async () => {
    const isolatedDb = await prepareDatabase()
    kafkaConfig = await generateIsolatedKafkaConfig()

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
    await app.init()

    prisma = module.get(DatabaseClient)
  })

  it("should create a record in the SourceCode table and return the uuid", async () => {
    // Given
    const requestBody: operations["createSourceCodeRef"]["requestBody"]["content"]["application/json"] =
      {
        s3: {
          url: "https://example.org/terraform.zip"
        }
      }

    // When
    const response = await request(app.getHttpServer())
      .post("/source-code-refs")
      .send(requestBody)

    // Expect

    // Validate response
    expect(response.headers.location).toBeDefined()

    const responseUuid: string =
      response.headers.location?.split("/").reverse()[0] ?? ""

    expect(response.status).toBe(201)

    // Validate side effects
    const sourceCodeDbObject = await prisma.sourceCode.findUnique({
      where: {
        id: responseUuid
      }
    })
    expect(sourceCodeDbObject).toBeDefined()
    expect(sourceCodeDbObject?.type).toEqual("S3")
    expect(sourceCodeDbObject?.reference).toEqual(requestBody.s3.url)
  })

  it("should return CREDENTIALS_DETECTED if the url contains credentials", async () => {
    // Given
    const requestBody: operations["createSourceCodeRef"]["requestBody"]["content"]["application/json"] =
      {
        s3: {
          url: "https://user:password@domain.local"
        }
      }

    // When
    const response = await request(app.getHttpServer())
      .post("/source-code-refs")
      .send(requestBody)

    // Expect
    expect(response.status).toBe(400)
    expect(response.body.errors[0].code).toEqual("CREDENTIALS_DETECTED")
  })

  describe("error handling", () => {
    it("should return INVALID_PROTOCOL if the url has an invalid protocol", async () => {
      // Given
      const requestBody: operations["createSourceCodeRef"]["requestBody"]["content"]["application/json"] =
        {
          s3: {
            url: "ftp://domain.local"
          }
        }

      // When
      const response = await request(app.getHttpServer())
        .post("/source-code-refs")
        .send(requestBody)

      // Expect
      expect(response.status).toBe(400)
      expect(response.body.errors[0].code).toEqual("INVALID_PROTOCOL")
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
    await app.close()
  })
})
