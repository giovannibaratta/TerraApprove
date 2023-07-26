/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest"
  },
  moduleNameMapper: {
    "@libs/domain/(.*)": "<rootDir>/libs/domain/src/$1",
    "@libs/service/(.*)": "<rootDir>/libs/service/src/$1"
  }
}
