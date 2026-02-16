/// <reference lib="webworker" />

import {
  ExtensionMessages,
  PluginMessages,
  EXTENSION_PLUGIN_SOURCE,
  EXTENSION_SOURCE,
  EXTENSION_TO_SW_SOURCE,
  ExtensionServiceWorkerMessages,
} from "@tweaker/extension-plugin";
import { version } from "../../package.json";

import PQueue from "p-queue";

const connections: Record<number, chrome.runtime.Port> = {};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "tweaker-devtools-relay") return;

  const extensionListener = (
    message: ExtensionServiceWorkerMessages.Message,
  ) => {
    if (message.source !== EXTENSION_TO_SW_SOURCE) return;
    if (message.type === "init-connection") {
      connections[message.tabId] = port;
      return;
    }
    if (message.type === "clear-messages") {
      clearMessages();
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
    if (!tabId) return false;
    if (message.source === EXTENSION_PLUGIN_SOURCE) {
      switch (message.type) {
        case "ping": {
          const _message: ExtensionMessages.PongMessage = {
            source: EXTENSION_SOURCE,
            version,
            type: "pong",
            payload: {
              name: message.payload.name,
              timestamp: Date.now(),
            },
          };
          chrome.tabs.sendMessage(tabId, _message);
          break;
        }
        case "init": {
          const _message: ExtensionMessages.InitMessage = {
            source: EXTENSION_SOURCE,
            version,
            type: "init",
            payload: {
              enabled: message.payload.enabled, // TODO: read enabled state from storage
              interceptors: message.payload.interceptors, // TODO: read interceptors from storage
              timestamp: Date.now(),
            },
          };
          chrome.tabs.sendMessage(tabId, _message);
          sendMessageToDevTools(tabId, { ...message, tabId });
          break;
        }
        case "value": {
          saveValueMessage(message);
          sendMessageToDevTools(tabId, { ...message, tabId });
          break;
        }
        default: {
          sendMessageToDevTools(tabId, { ...message, tabId });
        }
      }
    }
    return false;
  },
);

// prevent race conditions and add new messages in order
const saveValueQueue = new PQueue({ concurrency: 1 });

async function saveValueMessage(message: PluginMessages.ValueMessage) {
  return saveValueQueue.add(async () => {
    const { messages = [] } = await chrome.storage.session.get<{
      messages: PluginMessages.ValueMessage[];
    }>({ messages: [] });

    messages.push(message);

    const MAX_LENGTH = 1000;

    console.log({ messages });

    await chrome.storage.session.set({ messages: messages.slice(-MAX_LENGTH) });
  });
}

async function clearMessages() {
  return saveValueQueue.add(() => chrome.storage.session.set({ messages: [] }));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    // chrome.tabs.get(tabId).then((r) => {
    //   debugger;
    // });
    // chrome.devtools.inspectedWindow.eval("document.title", (result) => {
    //   alert("Page title: " + result);
    // });
    // console.log('App opened/refreshed in tab:', tabId);
    // debugger;
    // Trigger something in the content script
    // chrome.tabs.sendMessage(tabId, {
    //   source: "@tweaker/extension",
    //   version: "123",
    //   type: "init",
    //   payload: {
    //     data: [],
    //     name: "wtf",
    //     timestamp: Date.now(),
    //   },
    // });
  }
});
