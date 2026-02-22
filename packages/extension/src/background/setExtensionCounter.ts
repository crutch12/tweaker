export function setExtensionCounter(count: number, tabId: number) {
  if (!count) {
    chrome.action.setBadgeText({ text: "", tabId });
  } else {
    chrome.action.setBadgeBackgroundColor({
      color: [26, 115, 232, 255],
      tabId,
    });
    chrome.action.setBadgeTextColor({
      color: [255, 255, 255, 255],
      tabId,
    });
    chrome.action.setBadgeText({
      text: count < 100 ? count.toString() : "∞", // TODO: "❚❚" when paused
      tabId,
    });
  }
}
