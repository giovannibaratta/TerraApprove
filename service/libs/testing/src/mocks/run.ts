import {BaseRun} from "@libs/domain"
// eslint-disable-next-line node/no-unpublished-import
import {Chance} from "chance"

const random = new Chance()

export function generateMockRun(overrides: Partial<BaseRun>): BaseRun {
  const baseObj: BaseRun = {
    id: random.guid(),
    state: random.pickone([
      "pending_validation",
      "pending_approval",
      "approved",
      "rejected"
    ]),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }

  return {
    ...baseObj,
    ...overrides
  }
}
