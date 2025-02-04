export type Event =
  | "onMouseDown"
  | "onDrag"
  | "endDrag"
  | "onWheel"
  | "onMouseMove";
export type EventHandler<T> = (arg: T) => EventHandlerOptions | void;

export enum EventHandlerOptions {
  /** Stops only the default handler from being called. */
  preventDefault = 1 << 1,
  /** Stops any other event handlers from being called. The default handler will
   * still be called. */
  stopPropagation = 1 << 2,
}

export class EventsManager<T = void> {
  private eventHandlers: Map<Event, Map<string, EventHandler<T>>> = new Map();
  private defaultHandlers: Map<Event, EventHandler<T>> = new Map();
  private observer: EventHandler<T> | undefined;

  /** Registers a new event listener. An event listener can return `true` to
   * preventDefault. */
  register(event: Event, key: string, handler: EventHandler<T>) {
    let handlers = this.eventHandlers.get(event);
    if (handlers === undefined) {
      handlers = new Map();
      this.eventHandlers.set(event, handlers);
    }
    handlers.set(key, handler);
  }

  registerDefault(event: Event, defaultHandler: (arg: T) => void) {
    this.defaultHandlers.set(event, defaultHandler);
  }

  /** The observer is a function that will be called once before any listeners
   * are triggered. */
  setObserver(callback: EventHandler<T>) {
    this.observer = callback;
  }

  /** Clears all event handlers but not the default event handlers. If you want
   * to delete all handlers, just allocate a new manager. */
  clear() {
    this.eventHandlers.clear();
  }

  /** Deletes an event handler, and returns true iff successful. */
  unregister(event: Event, key: string) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      return handlers.delete(key);
    }
    return false;
  }

  /** Triggers all appropriate handlers listening for this event. If any
   * handlers were called, will also call `callback` if provided. */
  trigger(event: Event, arg: T) {
    let preventDefault = false;
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (this.observer) {
        this.observer(arg);
      }

      for (const handler of handlers.values()) {
        const res = handler(arg);
        if (typeof res !== "number") {
          continue;
        }
        if (
          (res & EventHandlerOptions.preventDefault) ===
          EventHandlerOptions.preventDefault
        ) {
          preventDefault = true;
        }
        if (
          (res & EventHandlerOptions.stopPropagation) ===
          EventHandlerOptions.stopPropagation
        ) {
          break;
        }
      }
    }

    if (!preventDefault) {
      const handler = this.defaultHandlers.get(event);
      if (handler) {
        handler(arg);
      }
    }
  }
}
