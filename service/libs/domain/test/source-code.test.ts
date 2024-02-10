import {doesUrlIncludeCredentials} from "@libs/domain"

describe("doesUrlIncludeCredentials", () => {
  it("should return true if the url has credentials", () => {
    // Given
    const url = "https://user:password@mydomain.local"

    // When
    const result = doesUrlIncludeCredentials(url)

    // Expect
    expect(result).toBe(true)
  })

  it("should return false if the url does not have credentials", () => {
    // Given
    const url = "https://mydomain.local"

    // When
    const result = doesUrlIncludeCredentials(url)

    // Expect
    expect(result).toBe(false)
  })

  it("should return true if the url has only a username", () => {
    // Given
    const url = "https://username:@mydomain.local"

    // When
    const result = doesUrlIncludeCredentials(url)

    // Expect
    expect(result).toBe(true)
  })

  it("should return true if the url has only a password", () => {
    // Given
    const url = "https://:password@mydomain.local"

    // When
    const result = doesUrlIncludeCredentials(url)

    // Expect
    expect(result).toBe(true)
  })
})
