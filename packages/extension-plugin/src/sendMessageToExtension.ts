import { version } from "../package.json";
import { EXTENSION_PLUGIN_SOURCE } from "./const";
import { ExtensionPluginMessages } from "./messages/types";

/**
 * Devtools App -> Tweaker (plugin)
 * @param type
 * @param payload
 */
export function sendMessageToExtension<
  T extends ExtensionPluginMessages.Message["type"],
>(
  type: T,
  payload: Extract<ExtensionPluginMessages.Message, { type: T }>["payload"],
) {
  if ("postMessage" in globalThis) {
    const message = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type,
      payload,
    } as ExtensionPluginMessages.Message;
    globalThis.postMessage(message, "*");
  }
}
