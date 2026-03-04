import type { EXTENSION_DEVTOOLS_SOURCE } from "../../const";
import type { InterceptorPayload } from "../../types";

interface DevtoolsAnyMessage<T, P> {
  source: typeof EXTENSION_DEVTOOLS_SOURCE;
  version: string;
  type: T;
  payload: P;
  tabId: number;
}

export namespace ExtensionDevtoolsMessages {
  export type PingMessage = DevtoolsAnyMessage<
    "ping",
    {
      timestamp: number;
    }
  >;

  export type PongMessage = DevtoolsAnyMessage<
    "pong",
    {
      name: string;
      timestamp: number;
    }
  >;

  export type InitMessage = DevtoolsAnyMessage<
    "init",
    {
      timestamp: number;
      enabled: boolean;
      interceptors: InterceptorPayload<unknown>[];
    }
  >;

  export type InterceptorsMessage = DevtoolsAnyMessage<
    "interceptors",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type AddInterceptorsMessage = DevtoolsAnyMessage<
    "interceptors:add",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type UpdateInterceptorsMessage = DevtoolsAnyMessage<
    "interceptors:update",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type RemoveInterceptorsMessage = DevtoolsAnyMessage<
    "interceptors:remove",
    {
      name: string;
      timestamp: number;
      data: Pick<InterceptorPayload<unknown>, "id">[];
    }
  >;

  export type DuplicateInterceptorsMessage = DevtoolsAnyMessage<
    "interceptors:duplicate",
    {
      name: string;
      timestamp: number;
      data: Pick<InterceptorPayload<unknown>, "id" | "expression">[];
    }
  >;

  export type ClearMessagesMessage = DevtoolsAnyMessage<
    "clear-messages",
    {
      timestamp: number;
    }
  >;

  export type ClearInterceptorsMessage = DevtoolsAnyMessage<
    "clear-interceptors",
    {
      timestamp: number;
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | InterceptorsMessage
    | AddInterceptorsMessage
    | UpdateInterceptorsMessage
    | RemoveInterceptorsMessage
    | DuplicateInterceptorsMessage
    | ClearMessagesMessage
    | ClearInterceptorsMessage;
}
