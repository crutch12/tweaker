import "../extension-polyfill";

import {
  ExtensionDevtoolsMessages,
  ExtensionPluginMessages,
  EXTENSION_PLUGIN_SOURCE,
  EXTENSION_DEVTOOLS_SOURCE,
  ExtensionBackgroundMessages,
  isPluginMessage,
  isDevtoolsMessage,
} from "@tweaker/extension-plugin";
import { version } from "../../package.json";

import { setExtensionIconAndPopup } from "./setExtensionIconAndPopup";
import { setExtensionCounter } from "./setExtensionCounter";
import { getInterceptorsStorage } from "./storage/InterceptorsStorage";
import { getTweakedCounterStorage } from "./storage/TweakedCounterStorage";
import { getMessagesStorage } from "./storage/MessagesStorage";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel?.({
    accessLevel: "TRUSTED_CONTEXTS",
  });
});

function sendMessageToPlugin(
  tabId: number,
  data: ExtensionDevtoolsMessages.Message,
) {
  const message: ExtensionBackgroundMessages.DevtoolsMessages = {
    ...data,
    target: EXTENSION_PLUGIN_SOURCE,
    tabId,
  };
  chrome.tabs.sendMessage(tabId, message);
}

function sendMessageToDevTools(
  tabId: number,
  data: ExtensionPluginMessages.Message,
) {
  const message: ExtensionBackgroundMessages.PluginMessages = {
    ...data,
    target: EXTENSION_DEVTOOLS_SOURCE,
    tabId,
  };
  chrome.runtime.sendMessage(message);
}

// plugin <-> background -> devtools
chrome.runtime.onMessage.addListener((message: unknown, sender): boolean => {
  if (!isPluginMessage(message)) return false;

  const tabId = sender.tab?.id;
  if (!tabId) return false;

  switch (message.type) {
    case "ping": {
      const _message: ExtensionBackgroundMessages.DevtoolsMessages = {
        source: EXTENSION_DEVTOOLS_SOURCE,
        target: EXTENSION_PLUGIN_SOURCE,
        version,
        type: "pong",
        payload: {
          name: message.payload.name,
          timestamp: Date.now(),
        },
        tabId,
      };
      sendMessageToPlugin(tabId, _message);
      break;
    }
    case "init": {
      setExtensionIconAndPopup("enabled", tabId);

      getTabUrl(tabId).then((url) => {
        if (!url) return;
        const interceptorsStorage = getInterceptorsStorage(url);
        interceptorsStorage
          .handleInterceptors(message.payload.interceptors)
          .then((interceptors) => {
            const _message: ExtensionBackgroundMessages.DevtoolsMessages = {
              source: EXTENSION_DEVTOOLS_SOURCE,
              target: EXTENSION_PLUGIN_SOURCE,
              version,
              type: "init",
              payload: {
                enabled: message.payload.enabled, // TODO: read enabled state from storage
                interceptors: interceptors, // TODO: read interceptors from storage
                timestamp: Date.now(),
              },
              tabId,
            };
            sendMessageToPlugin(tabId, _message);
            sendMessageToDevTools(tabId, message);
          });
      });
      break;
    }
    case "interceptors": {
      // handleInterceptors(message.payload).then((interceptors) => {
      //   sendMessageToDevTools(tabId, { ...message, payload: interceptors });
      // });
      sendMessageToDevTools(tabId, message);

      getTabUrl(tabId).then((url) => {
        if (!url) return;
        const storage = getTweakedCounterStorage(url);
        storage.getTabTweakedCounter(tabId).then((tweakedCounter) => {
          if (tweakedCounter) {
            message.payload.forEach((interceptor) => {
              sendMessageToDevTools(tabId, {
                type: "intercepted-count",
                version,
                source: EXTENSION_PLUGIN_SOURCE,
                payload: {
                  id: interceptor.id,
                  name: interceptor.name,
                  count: tweakedCounter[interceptor.id],
                },
              });
            });
          }
        });
      });
      break;
    }
    case "value": {
      sendMessageToDevTools(tabId, message);

      getTabUrl(tabId).then(async (url) => {
        if (!url) return;
        const storage = getMessagesStorage(url);
        storage.saveValueMessage(message);

        const tweakedCounterStorage = getTweakedCounterStorage(url);

        if (message.payload.tweaked && message.payload.interceptorId) {
          const { total, count } =
            await tweakedCounterStorage.increaseTweakedCounter(
              tabId,
              message.payload.interceptorId,
            );
          setExtensionCounter(total, tabId);
          sendMessageToDevTools(tabId, {
            type: "intercepted-count",
            version,
            source: EXTENSION_PLUGIN_SOURCE,
            payload: {
              id: message.payload.interceptorId,
              name: message.payload.name,
              count,
            },
          });
        }
      });

      break;
    }
    default: {
      sendMessageToDevTools(tabId, message);
    }
  }
  return false;
});

// devtools -> background -> plugin
chrome.runtime.onMessage.addListener((message: unknown, sender): boolean => {
  if (!isDevtoolsMessage(message)) return false;

  const _message: ExtensionBackgroundMessages.DevtoolsMessages = {
    ...message,
    target: EXTENSION_PLUGIN_SOURCE,
  };

  switch (message.type) {
    case "clear-interceptors":
      sendMessageToPlugin(message.tabId, _message);
      getTabUrl(message.tabId).then((url) => {
        if (!url) return;
        const storage = getInterceptorsStorage(url);
        storage.clearInterceptors();
      });
      break;
    case "clear-messages":
      getTabUrl(message.tabId).then((url) => {
        if (!url) return;
        const storage = getMessagesStorage(url);
        storage.clearMessages();
      });
      break;
    case "ping":
      sendMessageToPlugin(message.tabId, _message);
      getTabUrl(message.tabId).then((url) => {
        if (!url) return;
        const messagesStorage = getMessagesStorage(url);
        messagesStorage.getMessages().then((messages) => {
          sendMessageToDevTools(message.tabId, {
            type: "saved-messages",
            version,
            source: EXTENSION_PLUGIN_SOURCE,
            payload: {
              messages: messages.map((m) => m.payload),
            },
          });
        });
      });
      break;
    default:
      sendMessageToPlugin(message.tabId, _message);
  }

  return false;
});

function getTabUrl(tabId: number) {
  return chrome.tabs.get(tabId).then((tab) => tab.url);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    setExtensionIconAndPopup("disabled", tabId);
    setExtensionCounter(0, tabId);
    if (tab.url) {
      const storage = getTweakedCounterStorage(tab.url);
      storage.clearTweakedCounter();
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
