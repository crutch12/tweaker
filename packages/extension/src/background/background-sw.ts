import "../extension-polyfill";

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
import { setExtensionIconAndPopup } from "./setExtensionIconAndPopup";
import { setExtensionCounter } from "./setExtensionCounter";

const connections: Record<number, chrome.runtime.Port> = {};

const tweakedCounter: Record<number, number> = {};

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
    if (message.type === "clear-interceptors") {
      clearInterceptors();
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
  chrome.storage.session.setAccessLevel?.({
    accessLevel: "TRUSTED_CONTEXTS",
  });
});

function sendMessageToDevTools(tabId: number, data: PluginMessages.Message) {
  if (connections[tabId]) {
    connections[tabId].postMessage(data);
  }
}

// plugin <-> background -> devtools
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
          setExtensionIconAndPopup("enabled", tabId);
          handleInterceptors(message.payload.interceptors).then(
            (interceptors) => {
              const _message: ExtensionMessages.InitMessage = {
                source: EXTENSION_SOURCE,
                version,
                type: "init",
                payload: {
                  enabled: message.payload.enabled, // TODO: read enabled state from storage
                  interceptors: interceptors, // TODO: read interceptors from storage
                  timestamp: Date.now(),
                },
              };
              chrome.tabs.sendMessage(tabId, _message);
              sendMessageToDevTools(tabId, message);
            },
          );
          break;
        }
        case "interceptors": {
          // handleInterceptors(message.payload).then((interceptors) => {
          //   sendMessageToDevTools(tabId, { ...message, payload: interceptors });
          // });
          sendMessageToDevTools(tabId, message);
          break;
        }
        case "value": {
          if (message.payload.tweaked) {
            tweakedCounter[tabId] = tweakedCounter[tabId]
              ? tweakedCounter[tabId] + 1
              : 1;
            setExtensionCounter(tweakedCounter[tabId], tabId);
          }
          saveValueMessage(message);
          sendMessageToDevTools(tabId, message);
          break;
        }
        default: {
          sendMessageToDevTools(tabId, message);
        }
      }
    }
    return false;
  },
);

// devtools -> background -> plugin
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessages.Message & { tabId?: number }, sender) => {
    if (message.source === EXTENSION_SOURCE) {
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, message);
      }
    }
    return false;
  },
);

async function handleInterceptors(
  interceptors: ExtensionMessages.InitMessage["payload"]["interceptors"],
) {
  return getInterceptors().then(async (_savedInterceptors) => {
    const savedInterceptors = new Map(_savedInterceptors.map((i) => [i.id, i]));
    const fixedInterceptors = interceptors.map((i) => {
      const found = savedInterceptors.get(i.id);
      if (found) {
        savedInterceptors.delete(i.id);
        return {
          ...i,
          enabled: found.enabled,
          interactive: found.interactive,
          timestamp: found.timestamp,
          expression: found.expression, // TODO
        };
      }
      return i;
    });

    const finalInterceptors = fixedInterceptors
      .concat(Array.from(savedInterceptors.values()))
      .sort((x) => x.timestamp);

    await saveInterceptors(finalInterceptors);

    return finalInterceptors;
  });
}

// prevent race conditions and add new messages in order
const messagesStoreQueue = new PQueue({ concurrency: 1 });

async function saveValueMessage(message: PluginMessages.ValueMessage) {
  return messagesStoreQueue.add(async () => {
    const { messages } = await chrome.storage.session.get<{
      messages: PluginMessages.ValueMessage[];
    }>({ messages: [] });

    messages.push(message);

    const MAX_LENGTH = 1000;

    console.log({ messages });

    await chrome.storage.session.set({ messages: messages.slice(-MAX_LENGTH) });
  });
}

async function clearMessages() {
  return messagesStoreQueue.add(() =>
    chrome.storage.session.set({ messages: [] }),
  );
}

async function getMessages() {
  return messagesStoreQueue.add(async () => {
    const { messages = [] } = await chrome.storage.session.get<{
      messages: PluginMessages.ValueMessage[];
    }>({ messages: [] });

    return messages;
  });
}

// prevent race conditions and add new interceptors in order
const interceptorsStoreQueue = new PQueue({ concurrency: 1 });

async function saveInterceptors(
  newInterceptors: PluginMessages.InitMessage["payload"]["interceptors"],
) {
  return interceptorsStoreQueue.add(async () => {
    let { interceptors } = await chrome.storage.session.get<{
      interceptors: PluginMessages.InitMessage["payload"]["interceptors"];
    }>({ interceptors: [] });

    interceptors = Array.from(
      new Map(
        [...interceptors, ...newInterceptors]
          .filter((x) => x.staticId)
          .map((x) => [x.staticId!, x]),
      ).values(),
    );

    const MAX_LENGTH = 1000;

    console.log({ interceptors });

    await chrome.storage.session.set({
      interceptors: interceptors.slice(-MAX_LENGTH),
    });
  });
}

async function clearInterceptors() {
  return interceptorsStoreQueue.add(() =>
    chrome.storage.session.set({ interceptors: [] }),
  );
}

async function getInterceptors() {
  return interceptorsStoreQueue.add(async () => {
    const { interceptors } = await chrome.storage.session.get<{
      interceptors: PluginMessages.InitMessage["payload"]["interceptors"];
    }>({ interceptors: [] });

    return interceptors;
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    setExtensionIconAndPopup("disabled", tabId);
    if (tabId in tweakedCounter) {
      delete tweakedCounter[tabId];
      setExtensionCounter(0, tabId);
    }
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
