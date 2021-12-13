import { strict as nativeAssert } from "assert";

export function assert(expression: unknown): asserts expression {
  nativeAssert(expression);
}
