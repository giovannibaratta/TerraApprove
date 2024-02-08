// eslint-disable-next-line node/no-unpublished-import
import * as request from "supertest"

import {NestApplication} from "@nestjs/core"
// eslint-disable-next-line node/no-unpublished-import
import {Test, TestingModule} from "@nestjs/testing"
import {AppModule} from "@app/app.module"
import {operations} from "@apis/apis"
import {PrismaClient} from "@prisma/client"

describe("POST /source-code-refs", () => {
  let app: NestApplication

  const prisma = new PrismaClient()

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = module.createNestApplication()
    await app.init()
    await prisma.$connect()
  })

  beforeEach(async () => {
    await prisma.sourceCode.deleteMany()
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
    expect(sourceCodeDbObject?.type).toEqual("s3")
    expect(sourceCodeDbObject?.reference).toEqual(requestBody.s3.url)
  })

  afterAll(async () => {
    await prisma.sourceCode.deleteMany()
    await prisma.$disconnect()
    await app.close()
  })
})
