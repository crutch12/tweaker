export type TweakerKey = string;

export interface TweakListener<T> {
  interactive: boolean;
  patterns: readonly string[];
  handler: TweakHandler<T>;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export type TweakHandler<T> = (key: TweakerKey, value: T) => T;

export type RemoveListener = () => void;

export interface TweakerMessage {
  source: "@tweaker/core";
  version: string;
  type: "value";
  payload: {
    name: string;
    key: string;
    originalValue: unknown;
    result: unknown;
    timestamp: number;
  };
}
