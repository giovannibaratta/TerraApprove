// eslint-disable-next-line node/no-unpublished-import
import * as request from "supertest"
import {NestApplication} from "@nestjs/core"
// eslint-disable-next-line node/no-unpublished-import
import {Test, TestingModule} from "@nestjs/testing"
import {AppModule} from "@app/app.module"
import {operations} from "@apis/apis"
import {PrismaClient} from "@prisma/client"
import {cleanDatabase, prepareDatabase} from "@libs/testing/database"
import {Config} from "@libs/external/config/config"
import {DatabaseClient} from "@libs/external/db/database-client"

describe("POST /source-code-refs", () => {
  let app: NestApplication
  let prisma: PrismaClient

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

  afterAll(async () => {
    await cleanDatabase(prisma)
    await prisma.$disconnect()
    await app.close()
  })
})
