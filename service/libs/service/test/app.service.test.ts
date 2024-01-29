import {AppService} from "@libs/service/app.service"

describe("AppService", () => {
  let appService: AppService

  beforeEach(() => {
    appService = new AppService()
  })

  it("should return the correct message", () => {
    const result = appService.getHello()
    expect(result).toBe("Hello World!")
  })
})
