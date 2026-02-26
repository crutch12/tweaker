import type { EXTENSION_BACKGROUND_SOURCE } from "../../const";

type BackgroundAnyMessage<T, P> = {
  source: typeof EXTENSION_BACKGROUND_SOURCE;
  version: string;
  type: T;
  payload: P;
  tabId: number;
};

export namespace ExtensionBackgroundMessages {
  export type InitConnectionMessage = BackgroundAnyMessage<
    "init-connection",
    {
      timestamp: number;
    }
  >;

  export type ClearMessagesMessage = BackgroundAnyMessage<
    "clear-messages",
    {
      timestamp: number;
    }
  >;

  export type ClearInterceptorsMessage = BackgroundAnyMessage<
    "clear-interceptors",
    {
      timestamp: number;
    }
  >;

  export type Message =
    | InitConnectionMessage
    | ClearMessagesMessage
    | ClearInterceptorsMessage;
}
