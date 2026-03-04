import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { generateStorageKey, storage } from "./storage";

export function getMessagesStorage(url: string) {
  const store = storage.create<ExtensionPluginMessages.ValueMessage[]>(
    generateStorageKey(url, "messages"),
    [],
  );

  return {
    async saveValueMessage(message: ExtensionPluginMessages.ValueMessage) {
      return store.set((messages) => {
        messages.push(message);

        const MAX_LENGTH = 1000;

        return messages.slice(-MAX_LENGTH);
      });
    },

    async clearMessages() {
      return store.set(() => []);
    },

    async getMessages() {
      return store.get();
    },
  };
}
