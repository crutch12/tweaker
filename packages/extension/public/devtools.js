chrome.devtools.inspectedWindow.eval(
  "globalThis.__TWEAKER__.version",
  (result) => {
    if (typeof result === "string") {
      chrome.devtools.panels.create(
        "Tweaker",
        "icon.png",
        "src/devtools/index.html",
      );
    }
  },
);
