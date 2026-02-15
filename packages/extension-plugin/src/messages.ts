import type { EXTENSION_PLUGIN_SOURCE, EXTENSION_SOURCE } from "./const";
import type { TweakerIntercepter } from "@tweaker/core";

interface PluginAnyMessage<T, P> {
  source: typeof EXTENSION_PLUGIN_SOURCE;
  version: string;
  type: T;
  payload: P;
}

export type IntercepterPayload<T> = Pick<
  TweakerIntercepter<T>,
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

  export type InterceptersMessage = PluginAnyMessage<
    "intercepters",
    IntercepterPayload<unknown>[]
  >;

  export type NewInterceptMessage = PluginAnyMessage<
    "new-intercept",
    IntercepterPayload<unknown>
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
    | InterceptersMessage
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

  export type InterceptersMessage = ExtensionAnyMessage<
    "intercepters",
    {
      name: string;
      timestamp: number;
      data: IntercepterPayload<unknown>[];
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | InterceptersMessage;
}
