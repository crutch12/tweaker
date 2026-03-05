export type TweakerKey = string;

export type InterceptorId = string | number;

export type TweakerValueType = "default" | "fetch";

export interface InterceptorBase {
  /**
   * Unique interceptor id
   */
  id: InterceptorId;
  /**
   * If staticId is provided, extension-plugin can persist this interceptor
   */
  staticId?: InterceptorId;
  type: TweakerValueType;
  /**
   * "Creator" of interceptor (e.g. 'tweaker', 'extension')
   * @default 'tweaker'
   */
  owner: string;
  /**
   * Pattern (glob) to match the key
   * @example ['users.*.update']
   */
  patterns: string[];
  /**
   * Should stop via "debugger" during interception
   */
  interactive: boolean;
  enabled: boolean;
  timestamp: number;
  stack?: string;
  data?: Record<string | number, any>;
}

export interface TweakerInterceptor<K, V> extends InterceptorBase {
  handler: TweakHandler<K, V>;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export interface TweakHandlerContext {
  type: string;
  params: Record<string | number | symbol, any>;
  bypass: symbol;
}

export type TweakHandler<K, V> = (
  key: K,
  originalValue: V,
  ctx: TweakHandlerContext,
) => V | symbol;

export type RemoveListener = () => void;

export type TweakerAnyInterceptor = TweakerInterceptor<TweakerKey, any>;
