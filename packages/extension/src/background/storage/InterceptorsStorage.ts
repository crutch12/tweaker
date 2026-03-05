import {
  ExtensionDevtoolsMessages,
  ExtensionPluginMessages,
} from "@tweaker/extension-plugin";
import { generateStorageKey, storage } from "./storage";

export function getInterceptorsStorage(url: string) {
  const store = storage.create<
    ExtensionPluginMessages.InitMessage["payload"]["interceptors"]
  >(generateStorageKey(url, "interceptors"), []);

  async function saveInterceptors(
    newInterceptors: ExtensionPluginMessages.InitMessage["payload"]["interceptors"],
  ) {
    return store.set((interceptors) => {
      interceptors = Array.from(
        new Map(
          [...interceptors, ...newInterceptors]
            .filter((x) => x.staticId)
            .map((x) => [x.staticId!, x]),
        ).values(),
      );

      const MAX_LENGTH = 1000;

      return interceptors.slice(-MAX_LENGTH);
    });
  }

  async function getInterceptors() {
    return store.get();
  }

  return {
    async handleInterceptors(
      interceptors: ExtensionDevtoolsMessages.InitMessage["payload"]["interceptors"],
    ) {
      return getInterceptors().then(async (_savedInterceptors) => {
        const savedInterceptors = new Map(
          _savedInterceptors.map((i) => [i.id, i]),
        );
        const fixedInterceptors = interceptors.map((i) => {
          const found = savedInterceptors.get(i.id);
          if (found) {
            savedInterceptors.delete(i.id);
            return {
              ...i,
              enabled: found.enabled,
              interactive: found.interactive,
              timestamp: found.timestamp,
              expression: found.expression, // TODO
              type: found.type,
            };
          }
          return i;
        });

        const finalInterceptors = fixedInterceptors
          .concat(Array.from(savedInterceptors.values()))
          .sort((x) => x.timestamp);

        await saveInterceptors(finalInterceptors);

        return finalInterceptors;
      });
    },

    saveInterceptors,

    async clearInterceptors() {
      return store.set(() => []);
    },

    getInterceptors,
  };
}
