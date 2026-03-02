import "../extension-polyfill";
import { renderWidget } from "@tweaker/devtools-widget";

import "@tweaker/styles/radix-ui.css";
import "@tweaker/devtools-ui/styles.css";

const container = document.getElementById("root");

const urlParams = new URLSearchParams(window.location.search);

const tabId = urlParams.get("tabId")
  ? Number(urlParams.get("tabId"))
  : chrome?.devtools?.inspectedWindow?.tabId;

if (!tabId) {
  alert(
    `Couldn't find tab id (${tabId}).\nYou should provide it via ?tabId=TAB_ID`,
  );
}

if (container) {
  renderWidget(container, {
    tabId,
  });
}
