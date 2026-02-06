import { registerInstance } from "./global";
import {
  RemoveListener,
  TweakerKey,
  TweakHandler,
  TweakListener,
} from "./types";
import { minimatch } from "minimatch";
import { EventEmitter } from "eventemitter3";

export interface InterceptOptions {
  once: boolean;
  count: number;
  /**
   * Calls "debugger" when tweaks result
   */
  interactive: boolean;
}

export interface TweakerSample<T> {
  id: string;
  value: T;
  throw?: Error;
}

export interface TweakerValueOptions<T> {
  samples: TweakerSample<T>[];
}

export interface TweakerOptions {
  /**
   * Unique Tweaker name
   */
  name: string;
}

export type EventKeys = "value";

function keyMatchesPatterns(key: string, patterns: readonly string[]) {
  for (const pattern of patterns) {
    const found = minimatch(key, pattern);
    if (found) {
      return true;
    }
  }
  return false;
}

export class Tweaker {
  public readonly name: string;

  private readonly eventEmitter = new EventEmitter<EventKeys>();

  constructor({ name }: TweakerOptions) {
    this.name = name;
    registerInstance(this);
  }

  private listeners = new Set<TweakListener<any>>([]);

  value<T>(
    key: TweakerKey,
    value: T,
    options?: Partial<TweakerValueOptions<T>>,
  ): T {
    const [handled, result] = this.handleValue(key, value);
    if (handled) return result as T;
    return value;
  }

  intercept<T>(
    patterns: string | readonly string[],
    handler: TweakHandler<T>,
    options: InterceptOptions,
  ): RemoveListener {
    const listener: TweakListener<T> = {
      interactive: options.interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
    };

    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  interceptAfter(): RemoveListener {
    return () => {};
  }

  private debug(...args: any[]) {
    // console.debug("Tweaker", this.name, ...args); // @TODO: use npm "debug"
  }

  private log(...args: any[]) {
    console.log("Tweaker", this.name, ...args); // @TODO: use npm "debug"
  }

  private warn(...args: any[]) {
    console.warn("Tweaker", this.name, ...args); // @TODO: use npm "debug"
  }

  private findListeners(key: TweakerKey) {
    const listeners: TweakListener<any>[] = [];

    for (const listener of this.listeners) {
      const found = keyMatchesPatterns(key, listener.patterns);
      if (found) {
        listeners.push(listener);
      }
    }

    return listeners;
  }

  private handleValue<T>(
    key: TweakerKey,
    value: unknown,
  ): [boolean, T | undefined] {
    this.debug(key, "value", value);

    const listeners = this.findListeners(key);

    if (listeners.length === 0) {
      this.debug(key, "value", "no listeners found");
      return [false, undefined];
    }

    if (listeners.length > 1) {
      this.warn(key, "value", "too many listeners found", listeners);
    }

    const listener = listeners[listeners.length - 1];

    try {
      let result = listener.handler(key, value) as T;

      if (listener.interactive) {
        this.log(key, "interactive", [value, result]);
        debugger; // @TODO: check availability via performance call
      }

      this.eventEmitter.emit("value", key, value, result);

      return [true, result];
    } catch (err) {
      this.log(key, "error", err);
      throw err;
    }
  }

  // private async handleAfter(key: TweakerKey, result: unknown): boolean {
  //   this.debug(key, "after", result);
  // }

  // private handleValue(key: TweakerKey, value: unknown) {
  //   this.debug(key, "value", value);
  // }

  public subscribe(
    patterns: string | readonly string[],
    fn: (key: string, originalValue: unknown, result: unknown) => void,
  ) {
    patterns = Array.isArray(patterns) ? patterns : [patterns];
    const handler: typeof fn = (key, originalValue, result) => {
      const found = keyMatchesPatterns(key, patterns);
      if (found) {
        fn(key, originalValue, result);
      }
    };
    this.eventEmitter.addListener("value", handler);
    return () => {
      this.eventEmitter.removeListener("value", handler);
    };
  }

  public reset() {
    this.listeners.clear();
    // this.eventEmitter.removeAllListeners(); // @TODO: should we?
  }
}
