import type {
  PluginMessages,
  ExtensionMessages,
} from "@tweaker/extension-plugin";

if (!globalThis["chrome"]) {
  globalThis["chrome"] = globalThis["browser"];
}

// @TODO: restrict any import (except types)

const version = import.meta.env.VERSION;

// plugin -> background
window.addEventListener(
  "message",
  (event: MessageEvent<PluginMessages.Message>) => {
    if (event.data && event.data.source === "@tweaker/extension-plugin") {
      chrome.runtime.sendMessage(event.data);
    }
  },
);

// background -> plugin
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "@tweaker/extension") {
    console.log(message.type, message.tabId);
    window.postMessage(message, "*");
  }
  return false;
});

function init() {
  const message: ExtensionMessages.PingMessage = {
    type: "ping",
    payload: {
      timestamp: Date.now(),
    },
    source: "@tweaker/extension",
    version,
  };
  window.postMessage(message, "*");
}

// document.addEventListener("DOMContentLoaded", () => {
//   debugger;
// });

init();
