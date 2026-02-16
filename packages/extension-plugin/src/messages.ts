import type { EXTENSION_PLUGIN_SOURCE, EXTENSION_SOURCE } from "./const";
import type { TweakerInterceptor } from "@tweaker/core";

interface PluginAnyMessage<T, P> {
  source: typeof EXTENSION_PLUGIN_SOURCE;
  version: string;
  type: T;
  payload: P;
}

export type InterceptorPayload<T> = Pick<
  TweakerInterceptor<T>,
  "id" | "enabled" | "interactive" | "owner" | "patterns" | "timestamp"
> & {
  name: string;
  expression?: string;
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
      timestamp: number;
    }
  >;

  export type ValueMessage = PluginAnyMessage<
    "value",
    {
      name: string;
      key: string;
      originalValue: unknown;
      result: unknown;
      timestamp: number;
      tweaked: boolean;
      error: boolean;
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
      id: number;
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
      data: string[];
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

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | InterceptorsMessage;
}
