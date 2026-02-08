chrome.devtools.inspectedWindow.eval(
  "globalThis.__TWEAKER__.version",
  (result) => {
    if (typeof result === "string") {
      chrome.devtools.panels.create(
        "Tweaker",
        "icon.png",
        "src/devtools/index.html",
        (panel) => {
          panel.onShown(() => {
            alert("shown");
          });
          panel.show();
        },
      );
    }
  },
);

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
