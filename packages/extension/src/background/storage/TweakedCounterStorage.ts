import { InterceptorId } from "@tweaker/core";
import { generateStorageKey, storage } from "./storage";

export function getTweakedCounterStorage(url: string) {
  const store = storage.create<Record<number, Record<InterceptorId, number>>>(
    generateStorageKey(url, "tweakedCounter"),
    {},
  );

  async function getTabTweakedCounter(tabId: number) {
    return store.get().then((v) => v[tabId]);
  }

  async function increaseTweakedCounter(
    tabId: number,
    interceptorId: InterceptorId,
  ) {
    let total = 0;
    let count = 0;

    await store.set((tweakedCounter) => {
      const counter = tweakedCounter[tabId] ?? {};
      count = (counter[interceptorId] ?? 0) + 1;
      counter[interceptorId] = count;
      tweakedCounter[tabId] = counter;
      total = Object.values(counter).reduce((sum, count) => sum + count, 0);
      return tweakedCounter;
    });

    return { total, count };
  }

  async function clearTweakedCounter() {
    return store.set(() => ({}));
  }

  return {
    getTabTweakedCounter,
    increaseTweakedCounter,
    clearTweakedCounter,
  };
}
