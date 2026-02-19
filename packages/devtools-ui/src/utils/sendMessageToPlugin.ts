import { ExtensionMessages, EXTENSION_SOURCE } from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";

/**
 * Devtools App -> Tweaker (plugin)
 * @param type
 * @param payload
 */
export function sendMessageToPlugin<
  T extends ExtensionMessages.Message["type"],
>(
  type: T,
  payload: Extract<ExtensionMessages.Message, { type: T }>["payload"],
) {
  const currentTabId = chrome.devtools.inspectedWindow.tabId;
  const message = {
    source: EXTENSION_SOURCE,
    version,
    type,
    payload,
  } as ExtensionMessages.Message;
  chrome.tabs.sendMessage(currentTabId, message);
}
