import type {
  ExtensionPluginMessages,
  ExtensionDevtoolsMessages,
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
  (message: ExtensionDevtoolsMessages.Message, sender, sendResponse) => {
    if (message.source === "tweaker-extension-devtools") {
      window.postMessage(message, "*");
    }
    return false;
  },
);

function init() {
  const message: ExtensionDevtoolsMessages.PingMessage = {
    type: "ping",
    payload: {
      timestamp: Date.now(),
    },
    source: "tweaker-extension-devtools",
    version,
  };
  window.postMessage(message, "*");
}

// document.addEventListener("DOMContentLoaded", () => {
//   debugger;
// });

init();
