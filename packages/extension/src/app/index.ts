import "../extension-polyfill";
import { renderWidget } from "@tweaker/devtools-widget";

import "@tweaker/styles/radix-ui.css";
import "@tweaker/devtools-ui/styles.css";
import { subscribeDevtoolsSearch } from "./devtoolsSearch";
import {
  Bridge,
  EXTENSION_APP_SOURCE,
  EXTENSION_DEVTOOLS_SOURCE,
  ExtensionAppMessages,
  ExtensionDevtoolsMessages,
  isForDevtoolsMessage,
} from "@tweaker/extension-plugin";
import { version } from "../../package.json";

const urlParams = new URLSearchParams(window.location.search);

const tabId = urlParams.get("tabId")
  ? Number(urlParams.get("tabId"))
  : chrome?.devtools?.inspectedWindow?.tabId;

if (!tabId) {
  alert(
    `Couldn't find tab id (${tabId}).\nYou should provide it via ?tabId=TAB_ID`,
  );
}

const bridge: Bridge = {
  sendMessageToPlugin: (type, payload) => {
    const message = {
      source: EXTENSION_DEVTOOLS_SOURCE,
      version,
      type,
      payload,
    } as ExtensionDevtoolsMessages.Message;
    chrome.runtime.sendMessage({
      ...message,
      tabId,
    });
    return Promise.resolve();
  },
  sendMessageToExtension: () =>
    Promise.reject(
      "sendMessageToExtension is not available for tweaker devtools extension",
    ),
  onPluginMessage: (cb) => {
    const handler = (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ): boolean => {
      if (!isForDevtoolsMessage(message)) return false;

      if (message.tabId !== tabId) return false;

      const result = cb(message);

      if ("then" in result) {
        result.then(sendResponse);
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  },
  onExtensionMessage: () => {
    throw new Error(
      "onExtensionMessage is not available for tweaker devtools extension",
    );
  },
};

// waiting for __TWEAKER_DEVTOOLS__ initialization from devtools script
setTimeout(() => {
  const container = document.getElementById("root");
  if (container) {
    renderWidget(container, {
      tabId,
      canViewSourceCode: window.__TWEAKER_DEVTOOLS__?.canViewSourceCode,
      viewSourceCode: window.__TWEAKER_DEVTOOLS__?.viewSourceCode,
      url: window.__TWEAKER_DEVTOOLS__?.url,
      reinstallExtension: () => {
        const message: ExtensionAppMessages.ReinstallMessage = {
          type: "extension:reinstall",
          source: EXTENSION_APP_SOURCE,
          tabId,
        };
        chrome.runtime.sendMessage(message);
      },
      bridge,
    });
  }
}, 100);

subscribeDevtoolsSearch();
