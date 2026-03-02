import {
  ExtensionDevtoolsMessages,
  EXTENSION_DEVTOOLS_SOURCE,
} from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";

/**
 * Devtools App -> Tweaker (plugin)
 * @param type
 * @param payload
 */
export function sendMessageToPlugin<
  T extends ExtensionDevtoolsMessages.Message["type"],
>(
  type: T,
  payload: Extract<ExtensionDevtoolsMessages.Message, { type: T }>["payload"],
  tabId: number | undefined,
) {
  if (!tabId) return;
  const message = {
    source: EXTENSION_DEVTOOLS_SOURCE,
    version,
    type,
    payload,
  } as ExtensionDevtoolsMessages.Message;
  chrome.runtime.sendMessage({
    ...message,
    tabId,
  });
}
