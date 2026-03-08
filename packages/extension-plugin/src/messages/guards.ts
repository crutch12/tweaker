import { ExtensionBackgroundMessages } from "./types/ExtensionBackgroundMessages";
import { ExtensionDevtoolsMessages } from "./types/ExtensionDevtoolsMessages";
import { ExtensionPluginMessages } from "./types/ExtensionPluginMessages";
import {
  EXTENSION_APP_SOURCE,
  EXTENSION_DEVTOOLS_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "../const";
import { ExtensionAppMessages } from "./types/ExtensionAppMessages";

export function isPluginMessage(
  message: unknown,
): message is ExtensionPluginMessages.Message {
  if (!message || typeof message !== "object") return false;
  if ("source" in message && message.source === EXTENSION_PLUGIN_SOURCE)
    return true;
  return false;
}

export function isForDevtoolsMessage(
  message: unknown,
): message is ExtensionBackgroundMessages.PluginMessages {
  if (!message || typeof message !== "object") return false;
  if (
    "source" in message &&
    message.source === EXTENSION_PLUGIN_SOURCE &&
    "target" in message &&
    message.target === EXTENSION_DEVTOOLS_SOURCE
  )
    return true;
  return false;
}

export function isDevtoolsMessage(
  message: unknown,
): message is ExtensionDevtoolsMessages.Message {
  if (!message || typeof message !== "object") return false;
  if ("source" in message && message.source === EXTENSION_DEVTOOLS_SOURCE)
    return true;
  return false;
}

export function isForPluginMessage(
  message: unknown,
): message is ExtensionBackgroundMessages.DevtoolsMessages {
  if (!message || typeof message !== "object") return false;
  if (
    "source" in message &&
    message.source === EXTENSION_DEVTOOLS_SOURCE &&
    "target" in message &&
    message.target === EXTENSION_PLUGIN_SOURCE
  )
    return true;
  return false;
}

export function isExtensionAppMessage(
  message: unknown,
): message is ExtensionAppMessages.Message {
  if (!message || typeof message !== "object") return false;
  if ("source" in message && message.source === EXTENSION_APP_SOURCE)
    return true;
  return false;
}
