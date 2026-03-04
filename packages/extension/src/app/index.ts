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

// waiting for __TWEAKER_DEVTOOLS__ initialization from devtools script
setTimeout(() => {
  const container = document.getElementById("root");
  if (container) {
    renderWidget(container, {
      tabId,
      canViewSourceCode: window.__TWEAKER_DEVTOOLS__?.canViewSourceCode,
      viewSourceCode: window.__TWEAKER_DEVTOOLS__?.viewSourceCode,
      url: window.__TWEAKER_DEVTOOLS__?.url,
    });
  }
}, 100);

const searchResults = new Highlight();
CSS.highlights.set("search-results", searchResults);

window.addEventListener("devtools:search", (event) => {
  const queryString = event.detail?.queryString?.trim();
  if (!queryString) {
    searchResults.clear();
    return;
  }

  const contentArea = document.body;

  searchResults.clear();

  if (!queryString) return;

  const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT);

  let firstMatchRange = null;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const index =
      node.textContent?.toLowerCase().indexOf(queryString.toLowerCase()) ?? -1;

    if (index > -1) {
      const range = new Range();
      range.setStart(node, index);
      range.setEnd(node, index + queryString.length);
      searchResults.add(range);

      if (!firstMatchRange) {
        firstMatchRange = range;
      }
    }
  }

  // Go to the first highlighted instance
  if (firstMatchRange) {
    // Use scrollIntoView() on the range's start container (the text node)
    // Parent element is needed for the scroll method
    firstMatchRange.startContainer.parentElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
});
