/// <reference lib="webworker" />

const connections = {};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "tweaker-devtools-relay") return;

  const extensionListener = (message, sender) => {
    if (message.action === "init") {
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
  (/** @type {import('@tweaker/core').TweakerMessage} */ message, sender) => {
    const tabId = sender.tab?.id;
    if (message.source === "@tweaker/core") {
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
