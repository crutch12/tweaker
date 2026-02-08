import { PluginMessages } from "@tweaker/extension-plugin";

window.addEventListener(
  "message",
  (event: MessageEvent<PluginMessages.Message>) => {
    if (event.data && event.data.source === "@tweaker/extension-plugin") {
      chrome.runtime.sendMessage(event.data);
    }
  },
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "@tweaker/extension") {
    // alert("tweaker/extension");
    window.postMessage(message, "*");
  }
});
