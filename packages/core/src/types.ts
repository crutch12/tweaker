export type TweakerKey = string;

export interface TweakListener<T> {
  id: number;
  interactive: boolean;
  patterns: string[];
  handler: TweakHandler<T>;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export type TweakHandler<T> = (key: TweakerKey, value: T) => T;

export type RemoveListener = () => void;

interface TweakerAnyMessage<T, P> {
  source: "@tweaker/core";
  version: string;
  type: T;
  payload: P;
}

export type TweakerValueMessage = TweakerAnyMessage<
  "value",
  {
    name: string;
    key: string;
    originalValue: unknown;
    result: unknown;
    timestamp: number;
    tweaked: boolean;
  }
>;

export type TweakerNewInterceptMessage = TweakerAnyMessage<
  "new-intercept",
  {
    id: number;
    name: string;
    patterns: string[];
    interactive: boolean;
  }
>;

export type TweakerRemoveInterceptMessage = TweakerAnyMessage<
  "remove-intercept",
  {
    name: string;
    id: number;
  }
>;

export type TweakerMessage =
  | TweakerValueMessage
  | TweakerNewInterceptMessage
  | TweakerRemoveInterceptMessage;
