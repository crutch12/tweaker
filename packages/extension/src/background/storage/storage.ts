import { CachedStorage } from "@tweaker/core/utils";

export const storage = new CachedStorage({
  clear: chrome.storage.session.clear,
  getItem: (key) => chrome.storage.session.get(key).then((value) => value[key]),
  setItem: (key, value) => chrome.storage.session.set({ [key]: value }),
  removeItem: (key) => chrome.storage.session.remove(key), // TODO: doesn't properly work
});

export function generateStorageKey(url: string, key: string) {
  return [new URL(url).host, key].join("::");
}
