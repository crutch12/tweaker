import {
  RemoveListener,
  TweakerKey,
  TweakHandler,
  TweakerInterceptor,
  InterceptorId,
} from "./types";
import { EventEmitter } from "eventemitter3";
import { TweakerPlugin } from "./plugin";
import { TWEAKER_OWNER } from "./const";
import { generateNumberId, keyMatchesPatterns } from "./utils";

export interface InterceptOptions {
  /**
   * Calls "debugger" when tweaks result
   */
  interactive: boolean;
  owner?: string;
  /**
   * Unique interceptor id. If provided, extension-plugin can persist this interceptor
   */
  id?: InterceptorId;
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

interface ReadyOptions {
  /**
   * Tweaker's plugins ready timeout (ms)
   * @default 1000
   */
  timeout?: number;
  /**
   * Throw error if plugins throw error (or on timeout)
   * @default false
   */
  throw?: boolean;
}

export interface TweakerOptions {
  /**
   * Unique Tweaker name
   */
  name: string;
  /**
   * If should intercept values since creation
   * @default true
   */
  enabled?: boolean;
  /**
   * Extra plugins (e.g. @tweaker/extension-plugin)
   */
  plugins?: TweakerPlugin[];
}

type ValueEventOptions = {
  key: string;
  tweaked: boolean;
  originalValue: unknown;
  interceptorId?: InterceptorId;
  result?: unknown;
  error?: boolean;
  stack?: string;
};

export class Tweaker {
  public readonly name: string;
  public readonly plugins: TweakerPlugin[];
  private _enabled = true;
  private _isReady = false;

  private readonly eventEmitter = new EventEmitter<{
    value: (options: ValueEventOptions) => void;
    "intercept.new": <T>(listener: TweakerInterceptor<T>) => void;
    "intercept.update": <T>(listener: TweakerInterceptor<T>) => void;
    "intercept.remove": <T>(listener: TweakerInterceptor<T>) => void;
  }>();

  constructor({ name, plugins, enabled }: TweakerOptions) {
    this.name = name;
    this.plugins = plugins ?? [];
    this._enabled = enabled ?? true;
    this.setup();
  }

  public get enabled() {
    return this._enabled;
  }

  public enable() {
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
  }

  /**
   * Plugins are ready
   */
  public get isReady() {
    return this._isReady;
  }

  private setup() {
    this.plugins.forEach((plugin) => {
      plugin.setup(this);
    });
    const promises = this.plugins.map((plugin) => plugin.ready());
    Promise.allSettled(promises).finally(() => {
      this._isReady = true;
    });
  }

  /**
   * Wait for plugins to be ready
   * @param options
   * @returns
   */
  public async ready(options?: ReadyOptions) {
    options = {
      timeout: 1000,
      throw: false,
      ...options,
    };

    const timeoutPromise = new Promise((resolve, reject) =>
      setTimeout(() => {
        if (options.throw) {
          reject(new Error("tweaker plugins timeout"));
        }
        resolve(undefined);
      }, options.timeout),
    );
    const promises = this.plugins.map((plugin) => plugin.ready());
    const pluginsPromise = options.throw
      ? Promise.all(promises)
      : Promise.allSettled(promises);

    return Promise.race([timeoutPromise, pluginsPromise])
      .then(() => {
        return undefined;
      })
      .finally(() => {
        this._isReady = true;
      });
  }

  private listeners = new Map<InterceptorId, TweakerInterceptor<any>>([]);

  public value<T>(
    key: TweakerKey,
    value: T,
    options?: Partial<TweakerValueOptions<T>>,
  ): T {
    const stack = new Error().stack;
    const [handled, result] = this.handleValue(
      key,
      value,
      stack ? stack.replace("Error\n", "") : undefined,
    );
    if (handled) return result as T;
    return value;
  }

  public intercept<T>(
    patterns: string | readonly string[],
    handler: TweakHandler<T>,
    options: InterceptOptions,
  ): RemoveListener {
    const stack = new Error().stack;
    const owner = options.owner || TWEAKER_OWNER;
    const interceptor: TweakerInterceptor<T> = {
      id: options.id ?? generateNumberId(),
      staticId: options.id,
      interactive: options.interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
      owner,
      enabled: options.enabled ?? true,
      timestamp: Date.now(),
      stack:
        owner === TWEAKER_OWNER && stack
          ? stack.replace("Error\n", "")
          : undefined,
    };

    this.listeners.set(interceptor.id, interceptor);

    this.eventEmitter.emit(
      "intercept.new",
      interceptor as TweakerInterceptor<unknown>,
    );

    return () => {
      this.removeListener(interceptor.id);
      this.listeners.delete(interceptor.id);
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
    stack?: string,
  ): [boolean, T | undefined] {
    this.debug(key, "value", value);

    if (!this.enabled) {
      this.eventEmitter.emit("value", {
        key,
        tweaked: false,
        originalValue: value,
        stack,
      });
      return [false, undefined];
    }

    const listeners = this.findListeners(key);

    if (listeners.length === 0) {
      this.debug(key, "value", "no listeners found");
      this.eventEmitter.emit("value", {
        key,
        tweaked: false,
        originalValue: value,
        stack,
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
        interceptorId: listener.id,
        stack,
        // TODO: provide found pattern for info
        // TODO: provide sample id for info
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
        interceptorId: listener.id,
        stack,
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
      interceptorId,
      stack,
    }: ValueEventOptions) => {
      const found = keyMatchesPatterns(key, patterns);
      if (found) {
        fn({
          key,
          tweaked,
          originalValue,
          result,
          error,
          interceptorId,
          stack,
        });
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

  public getListener(id: InterceptorId): TweakerInterceptor<any> | undefined {
    return this.listeners.get(id);
  }

  public getListeners(): TweakerInterceptor<any>[] {
    return Array.from(this.listeners.values());
  }

  public hasListener(id: InterceptorId) {
    return this.listeners.has(id);
  }

  public removeListener(id: InterceptorId) {
    const interceptor = this.getListener(id);
    if (interceptor) {
      this.eventEmitter.emit(
        "intercept.remove",
        interceptor as TweakerInterceptor<unknown>,
      );
    }
    return this.listeners.delete(id);
  }

  public updateListener(
    id: InterceptorId,
    value: Partial<TweakerInterceptor<unknown>>,
  ) {
    const interceptor = this.getListener(id);
    if (interceptor) {
      Object.assign(interceptor, value);
      this.eventEmitter.emit("intercept.update", interceptor);
    }
    return interceptor;
  }
}
