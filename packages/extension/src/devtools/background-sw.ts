/// <reference lib="webworker" />

import { ExtensionMessages, PluginMessages } from "@tweaker/extension-plugin";

const connections: Record<number, chrome.runtime.Port> = {};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "tweaker-devtools-relay") return;

  const extensionListener = (
    message: ExtensionMessages.InitMessage & { tabId: number },
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

function sendMessageToDevTools(
  tabId: number,
  data: PluginMessages.Message & { tabId: number },
) {
  if (connections[tabId]) {
    connections[tabId].postMessage(data);
  }
}

chrome.runtime.onMessage.addListener(
  (message: PluginMessages.Message, sender) => {
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

async function saveMessage(message: PluginMessages.ValueMessage) {
  const { messages = [] } = await chrome.storage.session.get<{
    messages: PluginMessages.ValueMessage[];
  }>({ messages: [] });

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
