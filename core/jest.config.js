/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        // SKip type check

        isolatedModules: true
      }
    ]
  },
  moduleNameMapper: {
    "@libs/domain/(.*)": "<rootDir>/libs/domain/src/$1",
    "@libs/service/(.*)": "<rootDir>/libs/service/src/$1",
    "@libs/external/(.*)": "<rootDir>/libs/external/src/$1",
    "@libs/testing/(.*)": [
      "<rootDir>/libs/testing/src/$1",
      "<rootDir>/libs/domain/tests/$1"
    ]
  }
}
