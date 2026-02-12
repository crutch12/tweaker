interface PluginAnyMessage<T, P> {
  source: "@tweaker/extension-plugin";
  version: string;
  type: T;
  payload: P;
}

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
    }
  >;

  export type InterceptersMessage = PluginAnyMessage<
    "intercepters",
    {
      id: number;
      name: string;
      patterns: string[];
      interactive: boolean;
      source: string;
    }[]
  >;

  export type NewInterceptMessage = PluginAnyMessage<
    "new-intercept",
    {
      id: number;
      name: string;
      patterns: string[];
      interactive: boolean;
      source: string;
    }
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
  source: "@tweaker/extension";
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
      name: string;
      timestamp: number;
      data: string[];
    }
  >;

  export type InterceptersMessage = ExtensionAnyMessage<
    "intercepters",
    {
      name: string;
      timestamp: number;
      data: {
        id: number;
        name: string;
        patterns: string[];
        interactive: boolean;
        expression?: string;
      }[];
    }
  >;

  export type Message =
    | PingMessage
    | PongMessage
    | InitMessage
    | InterceptersMessage;
}
