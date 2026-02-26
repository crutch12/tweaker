import type {
  ExtensionPluginMessages,
  ExtensionBackgroundMessages,
} from "@tweaker/extension-plugin";

if (!globalThis["chrome"]) {
  globalThis["chrome"] = globalThis["browser"];
}

// @TODO: restrict any import (except types)

const version = import.meta.env.VERSION;

// plugin -> background
window.addEventListener(
  "message",
  (event: MessageEvent<ExtensionPluginMessages.Message>) => {
    if (event.data && event.data.source === "tweaker-extension-plugin") {
      chrome.runtime.sendMessage(event.data);
    }
  },
);

// background -> plugin
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionBackgroundMessages.DevtoolsMessages,
    sender,
    sendResponse,
  ): boolean => {
    if (
      message &&
      message.source === "tweaker-extension-devtools" &&
      message.target === "tweaker-extension-plugin"
    ) {
      window.postMessage(message, "*");
    }
    return false;
  },
);

function init() {
  const message: ExtensionBackgroundMessages.DevtoolsMessages = {
    type: "ping",
    payload: {
      timestamp: Date.now(),
    },
    source: "tweaker-extension-devtools",
    target: "tweaker-extension-plugin",
    version,
    tabId: -1,
  };
  window.postMessage(message, "*");
}

init();
