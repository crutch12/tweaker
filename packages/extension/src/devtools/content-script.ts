import type {
  PluginMessages,
  ExtensionMessages,
} from "@tweaker/extension-plugin";

// @TODO: restrict any import (except types)

const version = import.meta.env.VERSION;

// plugin -> extension
window.addEventListener(
  "message",
  (event: MessageEvent<PluginMessages.Message>) => {
    if (event.data && event.data.source === "@tweaker/extension-plugin") {
      chrome.runtime.sendMessage(event.data);
    }
  },
);

// extension -> plugin
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "@tweaker/extension") {
    // alert("tweaker/extension");
    window.postMessage(message, "*");
  }
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
