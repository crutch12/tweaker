/// <reference lib="webworker" />

const connections = {};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "tweaker-devtools-relay") return;

  const extensionListener = (
    /** @type {import('@tweaker/extension-plugin').ExtensionMessages.InitMessage} */ message,
    sender,
  ) => {
    if (message.source === "@tweaker/extension" && message.type === "init") {
      connections[message.tabId] = port;
      return;
    }
  };

  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(extensionListener);
    for (const tabId in connections) {
      if (connections[tabId] === port) {
        delete connections[tabId];
        break;
      }
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_CONTEXTS",
  });
});

function sendMessageToDevTools(tabId, data) {
  if (connections[tabId]) {
    connections[tabId].postMessage(data);
  }
}

chrome.runtime.onMessage.addListener(
  (
    /** @type {import('@tweaker/extension-plugin').PluginMessages.Message} */ message,
    sender,
  ) => {
    const tabId = sender.tab?.id;
    if (message.source === "@tweaker/extension-plugin") {
      switch (message.type) {
        case "value": {
          saveMessage(message);
          if (tabId) {
            sendMessageToDevTools(tabId, { ...message, tabId });
          }
          break;
        }
        default: {
          if (tabId) {
            sendMessageToDevTools(tabId, { ...message, tabId });
          }
        }
      }
    }
    return false;
  },
);

async function saveMessage(message) {
  const { messages = [] } = await chrome.storage.session.get({ messages: [] });

  messages.push(message);

  const MAX_LENGTH = 1000;

  await chrome.storage.session.set({ messages: messages.slice(-MAX_LENGTH) });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    // console.log('App opened/refreshed in tab:', tabId);

    // debugger;

    // Trigger something in the content script
    chrome.tabs.sendMessage(tabId, {
      source: "@tweaker/extension",
      version: "123",
      type: "init",
      payload: {
        data: [],
        name: "wtf",
        timestamp: Date.now(),
      },
    });
  }
});
