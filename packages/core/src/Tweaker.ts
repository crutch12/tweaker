import {
  RemoveListener,
  TweakerKey,
  TweakHandler,
  TweakListener,
} from "./types";
import { minimatch } from "minimatch";
import { EventEmitter } from "eventemitter3";
import { TweakerPlugin } from "./plugin";

const source = "@tweaker/core";

export interface InterceptOptions {
  once?: boolean;
  count?: number;
  /**
   * Calls "debugger" when tweaks result
   */
  interactive: boolean;
  source?: string;
  id?: number;
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
  /**
   * Extra plugins (e.g. @tweaker/extension-plugin)
   */
  plugins?: TweakerPlugin[];
}

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
  public readonly plugins: TweakerPlugin[];

  private readonly eventEmitter = new EventEmitter<{
    value: (
      key: string,
      tweaked: boolean,
      originalValue: unknown,
      result?: unknown,
    ) => void;
    "intercept.new": <T>(listener: TweakListener<T>) => void;
    "intercept.remove": <T>(listener: TweakListener<T>) => void;
  }>();

  constructor({ name, plugins }: TweakerOptions) {
    this.name = name;
    this.plugins = plugins ?? [];
    this.setup();
  }

  private setup() {
    this.plugins.forEach((plugin) => {
      plugin.setup(this);
    });
  }

  public async ready() {
    return Promise.all(this.plugins.map((plugin) => plugin.ready()));
  }

  private listeners = new Map<number, TweakListener<any>>([]);

  public value<T>(
    key: TweakerKey,
    value: T,
    options?: Partial<TweakerValueOptions<T>>,
  ): T {
    const [handled, result] = this.handleValue(key, value);
    if (handled) return result as T;
    return value;
  }

  public intercept<T>(
    patterns: string | readonly string[],
    handler: TweakHandler<T>,
    options: InterceptOptions,
  ): RemoveListener {
    const listener: TweakListener<T> = {
      id: options.id ?? Math.ceil(Math.random() * 1_000_000_000),
      interactive: options.interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
      source: options.source || source,
      enabled: true,
    };

    this.listeners.set(listener.id, listener);

    this.eventEmitter.emit("intercept.new", listener as TweakListener<unknown>);

    return () => {
      this.listeners.delete(listener.id);
      this.eventEmitter.emit(
        "intercept.remove",
        listener as TweakListener<unknown>,
      );
    };
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

    for (const listener of this.listeners.values()) {
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

  public on(
    event: "intercept.new" | "intercept.remove",
    fn: <T>(listener: TweakListener<T>) => void,
  ) {
    this.eventEmitter.addListener(event, fn);
    return () => {
      this.eventEmitter.removeListener(event, fn);
    };
  }

  public reset() {
    this.listeners.clear();
    // this.eventEmitter.removeAllListeners(); // @TODO: should we?
  }

  public getListeners(): TweakListener<any>[] {
    return Array.from(this.listeners.values());
  }

  public hasListener(id: number) {
    return this.listeners.has(id);
  }

  public removeListener(id: number) {
    return this.listeners.delete(id);
  }
}
