import type {
  EXTENSION_PLUGIN_SOURCE,
  EXTENSION_SOURCE,
  EXTENSION_TO_SW_SOURCE,
} from "./const";
import type { InterceptorBase, InterceptorId } from "@tweaker/core";

interface PluginAnyMessage<T, P> {
  source: typeof EXTENSION_PLUGIN_SOURCE;
  version: string;
  type: T;
  payload: P;
}

export type InterceptorPayload<T> = InterceptorBase & {
  name: string;
  expression?: string;
  sourceCode?: string;
};

export namespace PluginMessages {
  export type PingMessage = PluginAnyMessage<
    "ping",
    {
      name: string;
      timestamp: number;
    }
  >;

  export type PongMessage = PluginAnyMessage<
    "pong",
    {
      name: string;
      timestamp: number;
    }
  >;

  export type InitMessage = PluginAnyMessage<
    "init",
    {
      name: string;
      enabled: boolean;
      interceptors: InterceptorPayload<unknown>[];
      timestamp: number;
    }
  >;

  export type ValueMessage = PluginAnyMessage<
    "value",
    {
      id: string;
      name: string;
      key: string;
      originalValue: unknown;
      result: unknown;
      timestamp: number;
      tweaked: boolean;
      error: boolean;
      interceptorId: InterceptorId | undefined;
      stack: string | undefined;
    }
  >;

  export type InterceptorsMessage = PluginAnyMessage<
    "interceptors",
    InterceptorPayload<unknown>[]
  >;

  export type NewInterceptMessage = PluginAnyMessage<
    "new-intercept",
    InterceptorPayload<unknown>
  >;

  export type RemoveInterceptMessage = PluginAnyMessage<
    "remove-intercept",
    {
      name: string;
      id: InterceptorId;
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | ValueMessage
    | InterceptorsMessage
    | NewInterceptMessage
    | RemoveInterceptMessage;
}

interface ExtensionAnyMessage<T, P> {
  source: typeof EXTENSION_SOURCE;
  version: string;
  type: T;
  payload: P;
}

export namespace ExtensionMessages {
  export type PingMessage = ExtensionAnyMessage<
    "ping",
    {
      timestamp: number;
    }
  >;

  export type PongMessage = ExtensionAnyMessage<
    "pong",
    {
      name: string;
      timestamp: number;
    }
  >;

  export type InitMessage = ExtensionAnyMessage<
    "init",
    {
      timestamp: number;
      enabled: boolean;
      interceptors: InterceptorPayload<unknown>[];
    }
  >;

  export type InterceptorsMessage = ExtensionAnyMessage<
    "interceptors",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type AddInterceptorsMessage = ExtensionAnyMessage<
    "interceptors:add",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type UpdateInterceptorsMessage = ExtensionAnyMessage<
    "interceptors:update",
    {
      name: string;
      timestamp: number;
      data: InterceptorPayload<unknown>[];
    }
  >;

  export type RemoveInterceptorsMessage = ExtensionAnyMessage<
    "interceptors:remove",
    {
      name: string;
      timestamp: number;
      data: Pick<InterceptorPayload<unknown>, "id">[];
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | InterceptorsMessage
    | AddInterceptorsMessage
    | UpdateInterceptorsMessage
    | RemoveInterceptorsMessage;
}

type ExtensionServiceWorkerAnyMessage<T, P> = {
  source: typeof EXTENSION_TO_SW_SOURCE;
  version: string;
  type: T;
  payload: P;
  tabId: number;
};

export namespace ExtensionServiceWorkerMessages {
  export type InitConnectionMessage = ExtensionServiceWorkerAnyMessage<
    "init-connection",
    {
      timestamp: number;
    }
  >;

  export type ClearMessagesMessage = ExtensionServiceWorkerAnyMessage<
    "clear-messages",
    {
      timestamp: number;
    }
  >;

  export type ClearInterceptorsMessage = ExtensionServiceWorkerAnyMessage<
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
