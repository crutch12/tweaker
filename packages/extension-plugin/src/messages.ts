interface PluginAnyMessage<T, P> {
  source: "@tweaker/extension-plugin";
  version: string;
  type: T;
  payload: P;
}

export namespace PluginMessages {
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

  export type NewInterceptMessage = PluginAnyMessage<
    "new-intercept",
    {
      id: number;
      name: string;
      patterns: string[];
      interactive: boolean;
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
    | InitMessage
    | ValueMessage
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
  export type InitMessage = ExtensionAnyMessage<
    "init",
    {
      name: string;
      timestamp: number;
      data: string[];
    }
  >;

  export type Message = InitMessage;
}
