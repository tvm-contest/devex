import { assert } from "./assert";
import { timeout } from "./timeout";

export type RgSuccess<T> = {
  is_success: true;
  data: T;
};

export type RgError<E = number> = {
  is_success: false;
  error: {
    code: E;
    message?: string;
  };
};

export type RgResult<T, E = number> = RgSuccess<T> | RgError<E>;

export async function tryAttempts<T, E>(
  attemptFunction: () => (Promise<RgResult<T, E>>),
  attempts = Infinity
): Promise<RgResult<T, E>> {
  assert(attempts > 0);

  let result: RgResult<T, E>;

  do {
    result = await attemptFunction();

    if (!result.is_success) {
      console.log("Attempt failed:");
      console.log(result.error);

      await timeout(3000);
      continue;
    }

    break;
  } while (--attempts);

  return result;
}