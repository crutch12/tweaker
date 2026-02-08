window.addEventListener(
  "message",
  (
    /** @type {MessageEvent<import('@tweaker/extension-plugin').PluginMessages.Message>} */ event,
  ) => {
    if (event.data && event.data.source === "@tweaker/extension-plugin") {
      chrome.runtime.sendMessage(event.data);
    }
  },
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "@tweaker/extension") {
    window.postMessage(message, "*");
  }
});
