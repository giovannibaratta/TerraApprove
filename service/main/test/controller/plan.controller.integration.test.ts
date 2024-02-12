// eslint-disable-next-line node/no-unpublished-import
import * as request from "supertest"

import {NestApplication} from "@nestjs/core"
// eslint-disable-next-line node/no-unpublished-import
import {Test, TestingModule} from "@nestjs/testing"
import {AppModule} from "@app/app.module"
import {PrismaClient} from "@prisma/client"
import {CreatePlanRefRequestBody} from "@app/controller/plan-models"
import {cleanDatabase} from "@libs/testing/database"

describe("POST /plan-refs", () => {
  let app: NestApplication
  const endpoint = "/plan-refs"
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
    await cleanDatabase(prisma)
  })

  it("should create a record in the plan table and return the uuid", async () => {
    // Given
    const requestBody: CreatePlanRefRequestBody = {
      s3: {
        url: "https://example.org/terraform.zip"
      }
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

    expect(response.status).toBe(201)

    // Validate side effects
    const planDbObject = await prisma.plan.findUnique({
      where: {
        id: responseUuid
      }
    })
    expect(planDbObject).toBeDefined()
    expect(planDbObject?.type).toEqual("S3")
    expect(planDbObject?.reference).toEqual(requestBody.s3.url)
  })

  it("should return CREDENTIALS_DETECTED if the url contains credentials", async () => {
    // Given
    const requestBody: CreatePlanRefRequestBody = {
      s3: {
        url: "https://user:password@domain.local"
      }
    }

    // When
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .send(requestBody)

    // Expect
    expect(response.status).toBe(400)
    expect(response.body.errors[0].code).toEqual("CREDENTIALS_DETECTED")
  })

  describe("error handling", () => {
    it("should return INVALID_PROTOCOL if the url has an invalid protocol", async () => {
      // Given
      const requestBody: CreatePlanRefRequestBody = {
        s3: {
          url: "ftp://domain.local"
        }
      }

      // When
      const response = await request(app.getHttpServer())
        .post(endpoint)
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
