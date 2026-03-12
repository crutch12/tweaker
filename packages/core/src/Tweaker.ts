import {
  RemoveListener,
  TweakerKey,
  TweakHandler,
  TweakerInterceptor,
  InterceptorId,
  TweakerAnyInterceptor,
  InterceptorBase,
} from "./types";
import { EventEmitter } from "eventemitter3";
import { TweakerPlugin } from "./plugin";
import { DEFAULT_VALUE_TYPE, TWEAKER_OWNER } from "./const";
import {
  generateNumberId,
  generateStringId,
  getStack,
  keyMatchesPatterns,
} from "./utils";
import { registerInstance } from "./global";
import { DEFAULT_INTERCEPTOR_TYPE } from "./interceptors";

function debugResult<V, R>(key: TweakerKey, value: V, result: R) {
  try {
    // throws if CSP doesn't allow run "new Function"
    return new Function(
      "key",
      "value",
      "result",
      `debugger;
return result;`,
    )(key, value, result);
  } catch (err) {
    debugger; // NOTE: May be deleted by bundler (e.g. terser or esbuild)
    return result;
  }
}

export interface InterceptOptions {
  /**
   * Calls "debugger" when tweaks result
   */
  interactive?: boolean;
  owner?: string;
  /**
   * Unique interceptor id. If provided, extension-plugin can persist this interceptor
   */
  id?: InterceptorId;
  enabled?: boolean;
  type?: string;
  data?: Record<string, any>;
}

export interface SubscribeOptions {
  /**
   * @default 'tweaked'
   */
  mode: "all" | "tweaked" | "non-tweaked";
}

export interface TweakerSample<V> {
  id: string;
  value(): V;
}

export interface TweakerValueOptions<V> {
  id: string;
  type: string;
  samples: TweakerSample<V>[];
  params: Record<string | symbol, any>;
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

export interface TweakerOptions<
  Plugins extends Record<string, TweakerPlugin> = Record<string, TweakerPlugin>,
> {
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
  plugins?: Plugins;
}

type ValueEventOptions = {
  id: string;
  key: string;
  type: string;
  tweaked: boolean;
  originalValue: unknown;
  interceptorId?: InterceptorId;
  result?: unknown;
  error?: boolean;
  stack?: string;
};

type TweakerValueParams = {
  patterns: Record<TweakerKey, any>;
  plugins: Record<string, TweakerPlugin>;
};

type TweakerValidParams = Partial<TweakerValueParams>;

type GlobToTemplate<T extends string> = T extends `${infer Pre}**${infer Post}`
  ? `${Pre}${string}${GlobToTemplate<Post>}`
  : T extends `${infer Pre}*${infer Post}`
    ? `${Pre}${string}${GlobToTemplate<Post>}`
    : T;

export type TweakerValueKeys<T extends TweakerValidParams> =
  T extends TweakerValueParams ? keyof T["patterns"] : TweakerKey;

export type TweakerKeyValues<
  T extends TweakerValidParams,
  Key extends TweakerKey,
> = T extends TweakerValueParams ? T["patterns"][Key] : any;

export type TweakerGlobKeys<T extends TweakerValidParams> =
  T extends TweakerValueParams ? keyof T["patterns"] : TweakerKey;

export class Tweaker<
  T extends TweakerValidParams = {
    plugins: TweakerValueParams["plugins"];
  },
> {
  public readonly name: string;
  public readonly plugins: NonNullable<T["plugins"]>;
  private _enabled = true;
  private _isReady = false;

  protected readonly eventEmitter = new EventEmitter<{
    value: (options: ValueEventOptions) => void;
    "value.update": (id: string, options: Partial<ValueEventOptions>) => void;
    "intercept.new": (listener: TweakerAnyInterceptor) => void;
    "intercept.update": (listener: TweakerAnyInterceptor) => void;
    "intercept.remove": (listener: TweakerAnyInterceptor) => void;
    interceptors: (listener: TweakerAnyInterceptor[]) => void;
  }>();

  constructor({
    name,
    plugins,
    enabled,
  }: TweakerOptions<NonNullable<T["plugins"]>>) {
    this.name = name;
    this.plugins = plugins ?? ({} as NonNullable<T["plugins"]>);
    this._enabled = enabled ?? true;
    this.setup();
    registerInstance(this as Tweaker);
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

  public get untyped(): Tweaker<{}> {
    return this;
  }

  /**
   * Plugins are ready
   */
  public get isReady() {
    return this._isReady;
  }

  private setup() {
    Object.values(this.plugins).forEach((plugin) => {
      plugin.setup(this as Tweaker, this.eventEmitter, this.pluginHooks);
    });
    const promises = Object.values(this.plugins).map((plugin) =>
      plugin.ready(),
    );
    Promise.allSettled(promises).finally(() => {
      this._isReady = true;
    });
  }

  /**
   * Wait for plugins to be ready
   * @param options
   * @returns
   */
  public async ready(options?: ReadyOptions): Promise<boolean> {
    options = {
      timeout: 1000,
      throw: false,
      ...options,
    };

    const timeoutPromise = new Promise<boolean>((resolve, reject) =>
      setTimeout(() => {
        if (options.throw) {
          reject(new Error("tweaker plugins timeout"));
        }
        resolve(false);
      }, options.timeout),
    );
    const promises = Object.values(this.plugins).map((plugin) =>
      plugin.ready(),
    );
    const pluginsPromise = options.throw
      ? Promise.all(promises)
      : Promise.allSettled(promises);

    return Promise.race([
      timeoutPromise,
      pluginsPromise.then((arr) => arr.every(Boolean)),
    ])
      .then((success) => {
        return success;
      })
      .finally(() => {
        this._isReady = true; // TODO: is it okay?
      });
  }

  private listeners = new Map<InterceptorId, TweakerAnyInterceptor>([]);

  public value<
    V extends TweakerKeyValues<T, K>,
    K extends GlobToTemplate<TweakerValueKeys<T>> = GlobToTemplate<
      TweakerValueKeys<T>
    >,
  >(key: K, value: V, options: Partial<TweakerValueOptions<V>> = {}): V {
    const stack = getStack(2);
    const [handled, result] = this.handleValue(key, value, {
      ...options,
      stack,
    });
    if (handled) return result as V;
    return value;
  }

  public intercept<
    V extends TweakerKeyValues<T, K>,
    K extends GlobToTemplate<TweakerValueKeys<T>> = GlobToTemplate<
      TweakerValueKeys<T>
    >,
  >(
    patterns: K | K[],
    handler: TweakHandler<K, V>,
    {
      id,
      owner = TWEAKER_OWNER,
      enabled = true,
      interactive = false,
      type = DEFAULT_INTERCEPTOR_TYPE,
      data,
    }: InterceptOptions = {},
  ): RemoveListener {
    const stack = getStack(2);
    const interceptor: TweakerInterceptor<K, V> = {
      id: id ?? generateNumberId(),
      staticId: id,
      type,
      interactive,
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      handler,
      owner,
      enabled,
      timestamp: Date.now(),
      stack,
      data,
    };

    this.listeners.set(interceptor.id, interceptor as TweakerAnyInterceptor);

    this.eventEmitter.emit(
      "intercept.new",
      interceptor as TweakerAnyInterceptor,
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
    const exactListeners: TweakerAnyInterceptor[] = [];
    const patternListeners: TweakerAnyInterceptor[] = [];

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

  private handleValue<V>(
    key: TweakerKey,
    value: unknown,
    options: Partial<TweakerValueOptions<V>> & {
      stack?: string;
    },
  ): [boolean, V | undefined] {
    const id = options.id ?? generateStringId();
    const type = options.type ?? DEFAULT_VALUE_TYPE;
    this.debug(key, "value", value);

    if (!this.enabled) {
      this.eventEmitter.emit("value", {
        id,
        key,
        type,
        tweaked: false,
        originalValue: value,
        stack: options.stack,
      });
      return [false, undefined];
    }

    const listeners = this.findListeners(key);

    if (listeners.length === 0) {
      this.debug(key, "value", "no listeners found");
      this.eventEmitter.emit("value", {
        id,
        key,
        type,
        tweaked: false,
        originalValue: value,
        stack: options.stack,
      });
      return [false, undefined];
    }

    for (const listener of listeners) {
      const bypass = Symbol("tweaker:bypass");
      try {
        let result = listener.handler(key, value, {
          id,
          bypass,
          params: options.params ?? {},
          type,
        }) as V;

        if (result === bypass) {
          this.log(key, "skipped by bypass", [value]);
          continue;
        }

        if (listener.interactive) {
          this.log(key, "interactive", [value, result]);
          result = debugResult(key, value, result);
        }

        this.eventEmitter.emit("value", {
          id,
          key,
          type,
          tweaked: true,
          originalValue: value,
          result,
          interceptorId: listener.id,
          stack: options.stack,
          // TODO: provide found pattern for info
          // TODO: provide sample id for info
        });

        return [true, result];
      } catch (err) {
        this.log(key, "error", err);

        if (listener.interactive) {
          this.log(key, "interactive", [value, err]);
          err = debugResult(key, value, err);
        }

        this.eventEmitter.emit("value", {
          id,
          key,
          type,
          tweaked: true,
          originalValue: value,
          result: err,
          error: true,
          interceptorId: listener.id,
          stack: options.stack,
        });

        throw err;
      }
    }

    this.eventEmitter.emit("value", {
      id,
      key,
      type,
      tweaked: false,
      originalValue: value,
      stack: options.stack,
    });
    return [false, undefined];
  }

  public subscribe(
    patterns: string | string[],
    fn: (options: ValueEventOptions) => void,
    options?: Partial<SubscribeOptions>,
  ) {
    patterns = Array.isArray(patterns) ? patterns : [patterns];
    options = {
      mode: "tweaked",
      ...options,
    };

    const handler: typeof fn = ({
      id,
      key,
      type,
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
          id,
          key,
          type,
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
    fn: <T>(listener: TweakerAnyInterceptor) => void,
  ) {
    this.eventEmitter.addListener(event, fn);
    return () => {
      this.eventEmitter.removeListener(event, fn);
    };
  }

  public reset() {
    this.listeners.clear();
    this.eventEmitter.emit("interceptors", []);
    // this.eventEmitter.removeAllListeners(); // @TODO: should we?
  }

  public getListener(id: InterceptorId): TweakerAnyInterceptor | undefined {
    return this.listeners.get(id);
  }

  public getListeners(): TweakerAnyInterceptor[] {
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
        interceptor as TweakerAnyInterceptor,
      );
    }
    return this.listeners.delete(id);
  }

  public updateListener(
    id: InterceptorId,
    value: Partial<TweakerAnyInterceptor>,
  ) {
    const interceptor = this.getListener(id);
    if (interceptor) {
      Object.assign(interceptor, value);
      this.eventEmitter.emit("intercept.update", interceptor);
    }
    return interceptor;
  }

  public getPlugin<Key extends keyof T["plugins"]>(
    name: Key,
  ): T["plugins"][Key] {
    return this.plugins[name as string] as T["plugins"][Key];
  }

  protected pluginHooks = {
    addInterceptor: (interceptor: InterceptorBase) => {
      for (const plugin of Object.values(this.plugins)) {
        const handled = plugin.handleAddInterceptor?.(interceptor) ?? false;
        if (handled) {
          break;
        }
      }
    },
    updateInterceptor: (interceptor: InterceptorBase) => {
      for (const plugin of Object.values(this.plugins)) {
        const handled = plugin.handleUpdateInterceptor?.(interceptor) ?? false;
        if (handled) {
          break;
        }
      }
    },
  };
}

// const tw = new Tweaker<{
//   patterns: {
//     "users.replace": string;
//     "meta.*": number;
//     "meta.users.*": boolean;
//   };
// }>({ name: "123" });

// tw.value("users.replace", "scs");
// tw.value("meta.123", Math.random());
// tw.value("meta.users.123", true);

// tw.intercept("users.replace", (key, value) => {
//   return "123";
// });

// tw.intercept("meta.*", (key, value) => {
//   return Math.random();
// });

// tw.intercept([`meta.*`, "meta.use1rs.456"], (key, value) => {
//   return Math.random();
// });

// const tw2 = new Tweaker({ name: "123" });

// const num = tw2.value("users.replace", Math.random(), {
//   samples: [
//     {
//       id: "",
//       value: () => 1,
//     },
//   ],
// });

// tw2.intercept("users.replace", (key, value) => {
//   return Math.random();
// });
// tw2.intercept("users.repla1ce", () => {
//   return Math.random();
// });
