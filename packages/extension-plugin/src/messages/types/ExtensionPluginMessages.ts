import type { EXTENSION_PLUGIN_SOURCE } from "../../const";
import type { InterceptorPayload } from "../../types";
import type { InterceptorId, TweakerValueType } from "@tweaker/core";

interface PluginAnyMessage<T, P> {
  source: typeof EXTENSION_PLUGIN_SOURCE;
  version: string;
  type: T;
  payload: P;
}

export namespace ExtensionPluginMessages {
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
      type: TweakerValueType;
      originalValue: unknown;
      result: unknown;
      timestamp: number;
      tweaked: boolean;
      error: boolean;
      interceptorId: InterceptorId | undefined;
      stack: string | undefined;
    }
  >;

  export type ValueUpdateMessage = PluginAnyMessage<
    "value:update",
    Partial<ValueMessage["payload"]> & { id: string }
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

  export type IntercepterCountMessage = PluginAnyMessage<
    "intercepted-count",
    {
      name: string;
      id: InterceptorId;
      count: number;
    }
  >;

  export type SavedMessagesMessage = PluginAnyMessage<
    "saved-messages",
    {
      messages: ExtensionPluginMessages.ValueMessage["payload"][];
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | ValueMessage
    | ValueUpdateMessage
    | InterceptorsMessage
    | NewInterceptMessage
    | RemoveInterceptMessage
    | IntercepterCountMessage
    | SavedMessagesMessage;
}
