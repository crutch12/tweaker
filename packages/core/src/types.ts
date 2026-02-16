export type TweakerKey = string;

export interface TweakerInterceptor<T> {
  /**
   * Unique interceptor id
   */
  id: number | string;
  /**
   * If staticId is provided, extension-plugin can persist this interceptor
   */
  staticId?: number | string;
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
  handler: TweakHandler<T>;
  enabled: boolean;
  timestamp: number;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export type TweakHandler<T> = (key: TweakerKey, originalValue: T) => T;

export type RemoveListener = () => void;
