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
import type { InterceptorId } from "@tweaker/core";
import { CachedStorage } from "@tweaker/core/utils";

const storage = new CachedStorage({
  clear: chrome.storage.session.clear,
  getItem: (key) => chrome.storage.session.get(key).then((value) => value[key]),
  setItem: (key, value) => chrome.storage.session.set({ [key]: value }),
  removeItem: (key) => chrome.storage.session.remove(key), // TODO: doesn't properly work
});

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
      handleInterceptors(message.payload.interceptors).then((interceptors) => {
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
      break;
    }
    case "interceptors": {
      // handleInterceptors(message.payload).then((interceptors) => {
      //   sendMessageToDevTools(tabId, { ...message, payload: interceptors });
      // });
      sendMessageToDevTools(tabId, message);
      getTabTweakedCounter(tabId).then((tweakedCounter) => {
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
      });
      break;
    }
    case "value": {
      saveValueMessage(message);
      sendMessageToDevTools(tabId, message);
      (async () => {
        if (message.payload.tweaked && message.payload.interceptorId) {
          const { total, count } = await increaseTweakedCounter(
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
      })();
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
    case "init-connection":
      break;
    case "clear-interceptors":
      clearInterceptors();
      sendMessageToPlugin(message.tabId, _message);
      break;
    case "clear-messages":
      clearMessages();
      break;
    default:
      sendMessageToPlugin(message.tabId, _message);
  }

  return false;
});

async function handleInterceptors(
  interceptors: ExtensionDevtoolsMessages.InitMessage["payload"]["interceptors"],
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

async function saveValueMessage(message: ExtensionPluginMessages.ValueMessage) {
  const messagesStorage = storage.create<
    ExtensionPluginMessages.ValueMessage[]
  >("messages", []);

  return messagesStorage.set((messages) => {
    messages.push(message);

    const MAX_LENGTH = 1000;

    console.log({ messages });

    return messages.slice(-MAX_LENGTH);
  });
}

async function clearMessages() {
  const messagesStorage = storage.create<
    ExtensionPluginMessages.ValueMessage[]
  >("messages", []);
  return messagesStorage.set(() => []);
}

async function getMessages() {
  const messagesStorage = storage.create<
    ExtensionPluginMessages.ValueMessage[]
  >("messages", []);
  return messagesStorage.get();
}

async function saveInterceptors(
  newInterceptors: ExtensionPluginMessages.InitMessage["payload"]["interceptors"],
) {
  const interceptorsStorage = storage.create<
    ExtensionPluginMessages.InitMessage["payload"]["interceptors"]
  >("interceptors", []);

  return interceptorsStorage.set((interceptors) => {
    interceptors = Array.from(
      new Map(
        [...interceptors, ...newInterceptors]
          .filter((x) => x.staticId)
          .map((x) => [x.staticId!, x]),
      ).values(),
    );

    const MAX_LENGTH = 1000;

    console.log({ interceptors });

    return interceptors.slice(-MAX_LENGTH);
  });
}

async function clearInterceptors() {
  const interceptorsStorage = storage.create<
    ExtensionPluginMessages.InitMessage["payload"]["interceptors"]
  >("interceptors", []);
  return interceptorsStorage.set(() => []);
}

async function getInterceptors() {
  const interceptorsStorage = storage.create<
    ExtensionPluginMessages.InitMessage["payload"]["interceptors"]
  >("interceptors", []);
  return interceptorsStorage.get();
}

async function getTabTweakedCounter(tabId: number) {
  const tweakedCounterStorage = storage.create<
    Record<number, Record<InterceptorId, number>>
  >("tweakedCounter", {});
  return tweakedCounterStorage.get().then((v) => v[tabId]);
}

async function increaseTweakedCounter(
  tabId: number,
  interceptorId: InterceptorId,
) {
  const tweakedCounterStorage = storage.create<
    Record<number, Record<InterceptorId, number>>
  >("tweakedCounter", {});
  let total = 0;
  let count = 0;

  await tweakedCounterStorage.set((tweakedCounter) => {
    const counter = tweakedCounter[tabId] ?? {};
    count = (counter[interceptorId] ?? 0) + 1;
    counter[interceptorId] = count;
    tweakedCounter[tabId] = counter;
    total = Object.values(counter).reduce((sum, count) => sum + count, 0);
    return tweakedCounter;
  });

  return { total, count };
}

async function clearTweakedCounter() {
  const tweakedCounterStorage = storage.create<
    Record<number, Record<InterceptorId, number>>
  >("tweakedCounter", {});
  return tweakedCounterStorage.set(() => ({}));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    setExtensionIconAndPopup("disabled", tabId);
    clearTweakedCounter();
    setExtensionCounter(0, tabId);
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
