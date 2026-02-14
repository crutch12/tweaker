export type TweakerKey = string;

export interface TweakListener<T> {
  id: number;
  owner: string;
  interactive: boolean;
  patterns: string[];
  handler: TweakHandler<T>;
  enabled: boolean;
}

// type SyncOnly<T> = T extends Promise<any> ? "Error: Async functions are not allowed" : T;

export type TweakHandler<T> = (key: TweakerKey, value: T) => T;

export type RemoveListener = () => void;
