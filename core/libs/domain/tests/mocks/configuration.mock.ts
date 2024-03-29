import {Configuration} from "@libs/domain/configuration/configuration"

export function mockConfiguration(
  partial?: Partial<Configuration>
): Configuration {
  const baseObj: Configuration = {
    requireApprovalItems: [],
    global: {}
  }

  return {
    ...baseObj,
    ...partial
  }
}
