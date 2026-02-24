export type TweakerKey = string;

export type InterceptorId = string | number;

export interface InterceptorBase {
  /**
   * Unique interceptor id
   */
  id: InterceptorId;
  /**
   * If staticId is provided, extension-plugin can persist this interceptor
   */
  staticId?: InterceptorId;
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
}

export interface TweakerInterceptor<K, V> extends InterceptorBase {
  handler: TweakHandler<K, V>;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export type TweakHandler<K, V> = (key: K, originalValue: V) => V;

export type RemoveListener = () => void;

export type TweakerAnyInterceptor = TweakerInterceptor<TweakerKey, any>;
