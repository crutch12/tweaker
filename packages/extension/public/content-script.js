window.addEventListener("message", (event) => {
  if (event.data && event.data.source === "@tweaker/core") {
    chrome.runtime.sendMessage(event.data);
  }
});
