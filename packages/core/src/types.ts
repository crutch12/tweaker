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
