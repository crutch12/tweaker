import "../extension-polyfill";
import { renderWidget } from "@tweaker/devtools-widget";

import "@tweaker/styles/radix-ui.css";
import "@tweaker/devtools-ui/styles.css";

const container = document.getElementById("root");

const urlParams = new URLSearchParams(window.location.search);

const tabId = urlParams.get("tabId")
  ? Number(urlParams.get("tabId"))
  : undefined;

if (container) {
  renderWidget(container, {
    tabId: tabId || chrome?.devtools?.inspectedWindow?.tabId,
  });
}
