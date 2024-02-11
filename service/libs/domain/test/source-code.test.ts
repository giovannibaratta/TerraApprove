import {doesUrlIncludeCredentials, isHttpOrHttpsProtocol} from "@libs/domain"

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

describe("isHttpOrHttpsProtocol", () => {
  it("should return true if the url has http protocol", () => {
    // Given
    const url = "http://mydomain.local"

    // When
    const result = isHttpOrHttpsProtocol(url)

    // Expect
    expect(result).toBe(true)
  })

  it("should return true if the url has https protocol", () => {
    // Given
    const url = "https://mydomain.local"

    // When
    const result = isHttpOrHttpsProtocol(url)

    // Expect
    expect(result).toBe(true)
  })

  it("should return false if the url has another protocol", () => {
    // Given
    const url = "ftp://mydomain.local"

    // When
    const result = isHttpOrHttpsProtocol(url)

    // Expect
    expect(result).toBe(false)
  })
})
