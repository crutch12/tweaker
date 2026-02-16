import {
  RemoveListener,
  TweakerKey,
  TweakHandler,
  TweakerInterceptor,
} from "./types";
import { EventEmitter } from "eventemitter3";
import { TweakerPlugin } from "./plugin";
import { TWEAKER_OWNER } from "./const";
import { keyMatchesPatterns } from "./utils";

export interface InterceptOptions {
  once?: boolean;
  count?: number;
  /**
   * Calls "debugger" when tweaks result
   */
  interactive: boolean;
  owner?: string;
  id?: number;
  enabled?: boolean;
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

type ValueEventOptions = {
  key: string;
  tweaked: boolean;
  originalValue: unknown;
  result?: unknown;
  error?: boolean;
};

export class Tweaker {
  public readonly name: string;
  public readonly plugins: TweakerPlugin[];

  private readonly eventEmitter = new EventEmitter<{
    value: (options: ValueEventOptions) => void;
    "intercept.new": <T>(listener: TweakerInterceptor<T>) => void;
    "intercept.remove": <T>(listener: TweakerInterceptor<T>) => void;
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

  private listeners = new Map<number, TweakerInterceptor<any>>([]);

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
    const interceptor: TweakerInterceptor<T> = {
      id: options.id ?? Math.ceil(Math.random() * 1_000_000_000),
      interactive: options.interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
      owner: options.owner || TWEAKER_OWNER,
      enabled: options.enabled ?? true,
      timestamp: Date.now(),
    };

    this.listeners.set(interceptor.id, interceptor);

    this.eventEmitter.emit(
      "intercept.new",
      interceptor as TweakerInterceptor<unknown>,
    );

    return () => {
      this.listeners.delete(interceptor.id);
      this.eventEmitter.emit(
        "intercept.remove",
        interceptor as TweakerInterceptor<unknown>,
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
    const exactListeners: TweakerInterceptor<any>[] = [];
    const patternListeners: TweakerInterceptor<any>[] = [];

    for (const listener of this.listeners.values()) {
      if (!listener.enabled) continue;
      const found = keyMatchesPatterns(key, listener.patterns);
      switch (found) {
        case "exact": {
          exactListeners.push(listener);
        }
        case "pattern": {
          patternListeners.push(listener);
        }
      }
    }

    if (exactListeners.length > 0) {
      return exactListeners;
    }

    return patternListeners;
  }

  private handleValue<T>(
    key: TweakerKey,
    value: unknown,
  ): [boolean, T | undefined] {
    this.debug(key, "value", value);

    const listeners = this.findListeners(key);

    if (listeners.length === 0) {
      this.debug(key, "value", "no listeners found");
      this.eventEmitter.emit("value", {
        key,
        tweaked: false,
        originalValue: value,
      });
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

      this.eventEmitter.emit("value", {
        key,
        tweaked: true,
        originalValue: value,
        result,
      });

      return [true, result];
    } catch (err) {
      this.log(key, "error", err);

      if (listener.interactive) {
        this.log(key, "interactive", [value, err]);
        debugger; // @TODO: check availability via performance call
      }

      this.eventEmitter.emit("value", {
        key,
        tweaked: true,
        originalValue: value,
        result: err,
        error: true,
      });

      throw err;
    }
  }

  public subscribe(
    patterns: string | readonly string[],
    fn: (options: ValueEventOptions) => void,
    options?: Partial<SubscribeOptions>,
  ) {
    patterns = Array.isArray(patterns) ? patterns : [patterns];
    options = {
      mode: "tweaked",
      ...options,
    };

    const handler: typeof fn = ({
      key,
      tweaked,
      originalValue,
      result,
      error,
    }: ValueEventOptions) => {
      const found = keyMatchesPatterns(key, patterns);
      if (found) {
        fn({ key, tweaked, originalValue, result, error });
      }
    };
    this.eventEmitter.addListener("value", handler);
    return () => {
      this.eventEmitter.removeListener("value", handler);
    };
  }

  public on(
    event: "intercept.new" | "intercept.remove",
    fn: <T>(listener: TweakerInterceptor<T>) => void,
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

  public getListener(id: number): TweakerInterceptor<any> | undefined {
    return this.listeners.get(id);
  }

  public getListeners(): TweakerInterceptor<any>[] {
    return Array.from(this.listeners.values());
  }

  public hasListener(id: number) {
    return this.listeners.has(id);
  }

  public removeListener(id: number) {
    return this.listeners.delete(id);
  }
}
