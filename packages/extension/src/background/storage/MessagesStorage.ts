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

    async updateValueMessage(
      id: string,
      message: ExtensionPluginMessages.ValueUpdateMessage,
    ) {
      return store.set((messages) => {
        const foundMessage = messages.find((x) => x.payload.id === id);

        if (!foundMessage) return messages;

        foundMessage.payload = {
          ...foundMessage.payload,
          ...message.payload,
        };

        return messages;
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
