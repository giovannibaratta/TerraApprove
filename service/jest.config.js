const mainSettings = {
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
    "@app/(.*)": "<rootDir>/main/src/$1",
    "@libs/domain/(.*)": "<rootDir>/libs/domain/src/$1",
    "@libs/service/(.*)": "<rootDir>/libs/service/src/$1",
    "@libs/external/(.*)": "<rootDir>/libs/external/src/$1",
    "@libs/testing/(.*)": [
      "<rootDir>/libs/testing/src/$1",
      "<rootDir>/libs/domain/tests/$1"
    ],
    "@apis/(.*)": "<rootDir>/generated/interfaces/terraapprove-apis/$1"
  }
}

const testSettings = {
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "**/*.ts",
    // Source code exclusions
    "!**/testing/**",
    // Artifacts and other exclusions
    "!**/node_modules/**",
    "!**/*.mock.ts",
    "!build/**"
  ]
}

module.exports = {
  ...mainSettings,
  ...testSettings
}
