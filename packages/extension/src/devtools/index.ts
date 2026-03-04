import "../extension-polyfill";
import debounce from "../utils/debounce";
import { getBrowserType } from "@tweaker/core/utils";
import { normalizeUrlIfValid } from "../utils/normalizeUrlIfValid";

const evalScripts = {
  checkIfTweakerPresentInInspectedWindow: () =>
    `window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__ && window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__.version && window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__.instances.size > 0`,
  getUrl: () => `window.location.href`,
};

let tabUrl: string | undefined = undefined;

function showNoTweakerDisclaimer() {
  if (tweakerContainer) {
    tweakerContainer.document.body.innerHTML = `<h1 class="no-tweaker-disclaimer">This page doesn't have Tweaker, or it hasn't been loaded yet.</h1>`;
  }
}

function viewSourceCode(file: string, line: number, column: number) {
  chrome.devtools.panels.openResource(
    normalizeUrlIfValid(file),
    line - 1,
    column - 1,
  );
}

function setupContainerDevTools(container: Window) {
  const browserType = getBrowserType(navigator.userAgent);
  container.__TWEAKER_DEVTOOLS__ = {
    ...container.__TWEAKER_DEVTOOLS__,
    canViewSourceCode: ["chrome", "edge"].includes(browserType!),
    viewSourceCode,
    url: tabUrl,
  };
}

function mountTweakerDevTools(reload = false) {
  if (tweakerPanel) {
    if (reload && tweakerContainer) {
      tweakerContainer.location.reload(); // reload devtools page to show actual page + hide possible disclaimer
    }
    return;
  }
  const browserType = getBrowserType(navigator.userAgent);
  chrome.devtools.panels.create(
    ["chrome", "edge"].includes(browserType!) ? "Tweaker 🐛" : "Tweaker",
    "",
    "/src/app/index.html",
    (createdPanel) => {
      tweakerPanel = createdPanel;
      createdPanel.onShown.addListener((container) => {
        setupContainerDevTools(container);
        tweakerContainer = container;
        if (tweakerNotFound) {
          showNoTweakerDisclaimer();
        }
      });
    },
  );
}

let tweakerPanel: chrome.devtools.panels.ExtensionPanel | undefined = undefined;
let tweakerContainer: Window | undefined = undefined;

let tweakerPollingId: number | undefined;
let tweakerPollingAttempts = 0;
let tweakerNotFound = false;

function stopTweakerPolling() {
  clearTimeout(tweakerPollingId);
  tweakerPollingId = undefined;
  tweakerPollingAttempts = 0;
}

function mountTweakerDevToolsWhenTweakerHasLoaded() {
  chrome.devtools.inspectedWindow.eval(
    evalScripts.checkIfTweakerPresentInInspectedWindow(),
    (result, exceptionInfo) => {
      if (typeof result === "boolean" && result === true) {
        mountTweakerDevTools(tweakerNotFound);
        stopTweakerPolling();
        tweakerNotFound = false;
      } else {
        if (tweakerPollingAttempts < 5) {
          tweakerPollingId = setTimeout(
            mountTweakerDevToolsWhenTweakerHasLoaded,
            500,
          );
          tweakerPollingAttempts++;
        } else {
          stopTweakerPolling();
          showNoTweakerDisclaimer();
          tweakerNotFound = true;
        }
      }
    },
  );
}

function loadTabUrl() {
  chrome.devtools.inspectedWindow.eval(evalScripts.getUrl(), (url) => {
    if (typeof url === "string") {
      tabUrl = url;
    }
  });
}

const debouncedMountTweakerDevToolsCallback = debounce(
  mountTweakerDevToolsWhenTweakerHasLoaded,
  500,
);

function onNavigatedToOtherPage(url: string) {
  tabUrl = url;
  debouncedMountTweakerDevToolsCallback();
}

// Cleanup previous page state and remount everything
chrome.devtools.network.onNavigated.addListener(onNavigatedToOtherPage);

mountTweakerDevToolsWhenTweakerHasLoaded();

loadTabUrl();

// const currentTabId = chrome.devtools.inspectedWindow.tabId;

// alert(currentTabId);

// const message = {
//   source: "@tweaker/extension",
//   version,
//   type: "init",
//   payload: {
//     name: "test",
//     timestamp: Date.now(),
//     data: ["Message from extension!"],
//   },
// };

// chrome.tabs
//   .sendMessage(currentTabId, message)
//   .then(() => {
//     alert("message sent");
//   })
//   .catch((err) => {
//     alert(err);
//   });
