import debounce from "./utils/debounce";

const evalScripts = {
  checkIfTweakerPresentInInspectedWindow: () =>
    `window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__ && window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__.version && window.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__.instances.size > 0`,
};

function showNoTweakerDisclaimer() {
  if (tweakerContainer) {
    tweakerContainer.document.body.innerHTML = `<h1 class="no-tweaker-disclaimer">This page doesn't have Tweaker, or it hasn't been loaded yet.</h1>`;
  }
}

function mountTweakerDevTools(reload = false) {
  if (tweakerPanel) {
    if (reload && tweakerContainer) {
      tweakerContainer.location.reload(); // reload devtools page to show actual page + hide possible disclaimer
    }
    return;
  }
  chrome.devtools.panels.create(
    "Tweaker",
    "icon.png",
    "src/devtools/index.html",
    (createdPanel) => {
      tweakerPanel = createdPanel;
      createdPanel.onShown.addListener((container) => {
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
  chrome.devtools.inspectedWindow;
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

const debouncedMountTweakerDevToolsCallback = debounce(
  mountTweakerDevToolsWhenTweakerHasLoaded,
  500,
);

function onNavigatedToOtherPage(url: string) {
  debouncedMountTweakerDevToolsCallback();
}

// Cleanup previous page state and remount everything
chrome.devtools.network.onNavigated.addListener(onNavigatedToOtherPage);

mountTweakerDevToolsWhenTweakerHasLoaded();

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
