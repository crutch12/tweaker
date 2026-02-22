export function setExtensionIconAndPopup(
  type: "enabled" | "disabled",
  tabId: number,
) {
  chrome.action.setIcon({
    tabId,
    path: {
      "16": chrome.runtime.getURL(`icons/16-${type}.png`),
      "32": chrome.runtime.getURL(`icons/32-${type}.png`),
      "48": chrome.runtime.getURL(`icons/48-${type}.png`),
      "128": chrome.runtime.getURL(`icons/128-${type}.png`),
    },
  });

  chrome.action.setPopup({
    tabId,
    popup: chrome.runtime.getURL(`popups/${type}.html`),
  });
}
