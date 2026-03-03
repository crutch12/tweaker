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

import PQueue from "p-queue";
import { setExtensionIconAndPopup } from "./setExtensionIconAndPopup";
import { setExtensionCounter } from "./setExtensionCounter";
import type { InterceptorId } from "@tweaker/core";

const tweakedCounter: Map<number, Map<InterceptorId, number>> = new Map();

function increaseTweakerCounter(tabId: number, interceptorId: InterceptorId) {
  const counter = tweakedCounter.get(tabId) ?? new Map<InterceptorId, number>();
  const count = (counter.get(interceptorId) ?? 0) + 1;
  counter.set(interceptorId, count);
  tweakedCounter.set(tabId, counter);
  const total = Array.from(counter.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  return { count, total };
}

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
      break;
    }
    case "value": {
      saveValueMessage(message);
      sendMessageToDevTools(tabId, message);
      if (message.payload.tweaked && message.payload.interceptorId) {
        const { total, count } = increaseTweakerCounter(
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

// prevent race conditions and add new messages in order
const messagesStoreQueue = new PQueue({ concurrency: 1 });

async function saveValueMessage(message: ExtensionPluginMessages.ValueMessage) {
  return messagesStoreQueue.add(async () => {
    const { messages } = await chrome.storage.session.get<{
      messages: ExtensionPluginMessages.ValueMessage[];
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
      messages: ExtensionPluginMessages.ValueMessage[];
    }>({ messages: [] });

    return messages;
  });
}

// prevent race conditions and add new interceptors in order
const interceptorsStoreQueue = new PQueue({ concurrency: 1 });

async function saveInterceptors(
  newInterceptors: ExtensionPluginMessages.InitMessage["payload"]["interceptors"],
) {
  return interceptorsStoreQueue.add(async () => {
    let { interceptors } = await chrome.storage.session.get<{
      interceptors: ExtensionPluginMessages.InitMessage["payload"]["interceptors"];
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
      interceptors: ExtensionPluginMessages.InitMessage["payload"]["interceptors"];
    }>({ interceptors: [] });

    return interceptors;
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We look for 'complete' status so the content script is likely ready
  if (changeInfo.status === "complete") {
    setExtensionIconAndPopup("disabled", tabId);
    if (tabId in tweakedCounter) {
      tweakedCounter.delete(tabId);
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
