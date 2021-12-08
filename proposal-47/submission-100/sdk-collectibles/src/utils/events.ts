type EventListener<T> = (event: T) => void | Promise<void>;

type EventListenerEntry<T> = {
  callback: EventListener<T>;
};

export class Event<T> {
  private listeners: EventListenerEntry<T>[] = [];

  public on(callback: EventListener<T>): void {
    this.listeners.push({
      callback,
    });
  }

  public async emit(event: T): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const listener of this.listeners) {
      const result = listener.callback(event);

      if (result) {
        promises.push(result);
      }
    }

    await Promise.all(promises);
  }
}
