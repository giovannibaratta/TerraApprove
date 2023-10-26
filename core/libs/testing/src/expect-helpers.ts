import {Either, Right, isRight} from "fp-ts/lib/Either"
// eslint-disable-next-line node/no-unpublished-import
import "expect-more-jest"

export function expectRight<R>(
  input: Either<unknown, R>
): asserts input is Right<R> {
  expect(isRight(input)).toBeTrue()
}
