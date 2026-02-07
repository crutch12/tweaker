import {
  notifyExtensionNewIntercept,
  notifyExtensionRemoveIntercept,
  registerInstance,
} from "./global";
import {
  RemoveListener,
  TweakerKey,
  TweakerMessage,
  TweakHandler,
  TweakListener,
} from "./types";
import { minimatch } from "minimatch";
import { EventEmitter } from "eventemitter3";
import { version } from "../package.json";
import { klona } from "klona/json";
import { TweakerValueMessage } from "../dist";

export interface InterceptOptions {
  once: boolean;
  count: number;
  /**
   * Calls "debugger" when tweaks result
   */
  interactive: boolean;
}

export interface SubscribeOptions {
  /**
   * @default 'tweaked'
   */
  mode: "all" | "tweaked" | "non-tweaked";
}

export interface TweakerSample<T> {
  id: string;
  value(): T;
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

  private readonly eventEmitter = new EventEmitter<{
    value: (
      key: string,
      tweaked: boolean,
      originalValue: unknown,
      result?: unknown,
    ) => void;
  }>();

  constructor({ name }: TweakerOptions) {
    this.name = name;
    registerInstance(this);
    this.setup();
  }

  private setup() {
    if ("postMessage" in globalThis) {
      this.subscribe(
        "*",
        (key, tweaked, originalValue, result) => {
          const message: TweakerValueMessage = {
            source: "@tweaker/core",
            version,
            type: "value",
            payload: {
              name: this.name,
              key,
              originalValue: klona(originalValue),
              result: klona(result),
              timestamp: Date.now(),
              tweaked,
            },
          };
          globalThis.postMessage(message, "*");
        },
        { mode: "all" },
      );
    }
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
      id: Math.ceil(Math.random() * 1_000_000),
      interactive: options.interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
    };

    this.listeners.add(listener);

    notifyExtensionNewIntercept(this, listener);

    return () => {
      this.listeners.delete(listener);
      notifyExtensionRemoveIntercept(this, listener);
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
      this.eventEmitter.emit("value", key, false, value);
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

      this.eventEmitter.emit("value", key, true, value, result);

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
    fn: (
      key: string,
      tweaked: boolean,
      originalValue: unknown,
      result?: unknown,
    ) => void,
    options?: Partial<SubscribeOptions>,
  ) {
    patterns = Array.isArray(patterns) ? patterns : [patterns];
    options = {
      mode: "tweaked",
      ...options,
    };

    const handler: typeof fn = (key, tweaked, originalValue, result) => {
      const found = keyMatchesPatterns(key, patterns);
      if (found) {
        fn(key, tweaked, originalValue, result);
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
