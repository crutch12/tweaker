import "../extension-polyfill";
import { renderWidget } from "@tweaker/devtools-widget";

import "@tweaker/styles/radix-ui.css";
import "@tweaker/devtools-ui/styles.css";

const urlParams = new URLSearchParams(window.location.search);

const tabId = urlParams.get("tabId")
  ? Number(urlParams.get("tabId"))
  : chrome?.devtools?.inspectedWindow?.tabId;

if (!tabId) {
  alert(
    `Couldn't find tab id (${tabId}).\nYou should provide it via ?tabId=TAB_ID`,
  );
}

chrome.tabs.get(tabId).then((tab) => {
  // waiting for __TWEAKER_DEVTOOLS__ initialization from devtools script
  setTimeout(() => {
    const container = document.getElementById("root");
    if (container) {
      renderWidget(container, {
        tabId,
        canViewSourceCode: window.__TWEAKER_DEVTOOLS__?.canViewSourceCode,
        viewSourceCode: window.__TWEAKER_DEVTOOLS__?.viewSourceCode,
        url: tab.url,
      });
    }
  }, 100);
});
