import { EXTENSION_PLUGIN_SOURCE } from "./const";
import { ExtensionPluginMessages } from "./messages/types/ExtensionPluginMessages";
import { Bridge } from "./types";
import { version } from "../package.json";
import { isForPluginMessage } from "./messages/guards";

export const bridge: Bridge = {
  sendMessageToExtension: (type, payload) => {
    if ("postMessage" in globalThis) {
      const message = {
        source: EXTENSION_PLUGIN_SOURCE,
        version,
        type,
        payload,
      } as ExtensionPluginMessages.Message;
      globalThis.postMessage(message, "*");
    }
    return Promise.resolve();
  },
  sendMessageToPlugin: () =>
    Promise.reject(
      "sendMessageToPlugin is not available for tweaker extension plugin",
    ),
  onPluginMessage: () => {
    throw new Error(
      "onPluginMessage is not available for tweaker extension plugin",
    );
  },
  onExtensionMessage: (cb) => {
    if (!("addEventListener" in globalThis)) return () => {};

    const handler = (event: MessageEvent) => {
      if (!isForPluginMessage(event.data)) return;
      return cb(event.data);
    };

    globalThis.addEventListener("message", handler);
    return () => globalThis.removeEventListener("message", handler);
  },
};
