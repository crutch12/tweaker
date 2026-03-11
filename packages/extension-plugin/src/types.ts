import type { InterceptorBase } from "@tweaker/core";
import { ExtensionDevtoolsMessages } from "./messages/types/ExtensionDevtoolsMessages";
import { ExtensionPluginMessages } from "./messages/types/ExtensionPluginMessages";

export type InterceptorPayload<T extends InterceptorBase = InterceptorBase> =
  T & {
    name: string;
    sourceCode?: string;
    // data?: {
    //   // TODO: narrow data type using "type" field
    //   // type: expression
    //   expression?: string;
    //   // type: fetch
    //   json?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   text?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   blob?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   formData?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   arrayBuffer?: {
    //     static?: string;
    //     expression?: string;
    //   };
    // };
  };

// export type TypedInterceptorPayload<
//   T extends string,
//   D extends Record<string, any>,
// > = Omit<InterceptorPayload, "type" | "data"> & {
//   type: T;
//   data?: D;
// };

export interface Bridge {
  /**
   * Devtools App -> Tweaker (plugin)
   * @param type
   * @param payload
   */
  sendMessageToPlugin: <T extends ExtensionDevtoolsMessages.Message["type"]>(
    type: T,
    payload: Extract<ExtensionDevtoolsMessages.Message, { type: T }>["payload"],
  ) => Promise<any>;
  /**
   * Tweaker (plugin) -> Devtools App
   * @param type
   * @param payload
   */
  sendMessageToExtension: <T extends ExtensionPluginMessages.Message["type"]>(
    type: T,
    payload: Extract<ExtensionPluginMessages.Message, { type: T }>["payload"],
  ) => Promise<any>;
  onExtensionMessage: (
    cb: (message: ExtensionDevtoolsMessages.Message) => any,
  ) => () => void;
  onPluginMessage: (
    cb: (message: ExtensionPluginMessages.Message) => any,
  ) => () => void;
}
