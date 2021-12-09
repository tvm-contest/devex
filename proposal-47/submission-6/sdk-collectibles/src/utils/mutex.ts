import { assert } from "./assert";

type PromiseResolve = () => void;

type MutexPromise = {
  promise: Promise<void>;
  resolve: PromiseResolve;
};

type Mutex = {
  queue: MutexPromise[];
};

const mutexes: Record<string, Mutex | undefined> = {};

export async function mutexLockOrAwait(mutexName: string): Promise<void> {
  let isLocked = true;

  if (!mutexes[mutexName]) {
    mutexes[mutexName] = <Mutex>{
      queue: [],
    };

    isLocked = false;
  }

  const mutex = mutexes[mutexName];

  assert(mutex);

  const queue: MutexPromise[] = mutex.queue;

  const queueEntry: {
    promise: Promise<void> | null;
    resolve: PromiseResolve | null;
  } = {
    promise: null,
    resolve: null,
  };

  const result: Promise<void> = new Promise((resolve) => {
    queueEntry.resolve = () => {
      resolve();
    };
  });

  assert(queueEntry.resolve);

  queueEntry.promise = result;

  queue.push({
    promise: queueEntry.promise,
    resolve: queueEntry.resolve,
  });

  if (isLocked) {
    const entry = queue[queue.length - 2];
    assert(entry !== undefined);
    return entry.promise;
  }

  return;
}

export function mutexUnlock(mutexName: string): void {
  const mutex = mutexes[mutexName];

  assert(mutex);

  const nextPromise = mutex.queue.shift();

  if (!nextPromise) {
    throw new Error("nextPromise is undefined");
  }

  if (mutex.queue.length === 0) {
    delete mutexes[mutexName];
  }

  nextPromise.resolve();
}
