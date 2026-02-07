window.addEventListener("message", (event) => {
  if (event.data && event.data.source === "@tweaker/core") {
    chrome.runtime.sendMessage(event.data);
  }
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.source === "@tweaker/extension") {
//     window.postMessage(message, "*");
//   }
// });
