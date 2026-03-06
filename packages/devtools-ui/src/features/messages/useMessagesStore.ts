import { create } from "zustand";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { subscribeWithSelector } from "zustand/middleware";

type ExtensionMessage = ExtensionPluginMessages.ValueMessage["payload"];

interface MessagesState {
  messages: ExtensionMessage[];
  set: (messages: ExtensionMessage[]) => void;
  add: (messages: ExtensionMessage[]) => void;
  remove: (messages: Pick<ExtensionMessage, "id">[]) => void;
  update: (message: Partial<ExtensionMessage> & { id: string }) => void;
}

export const useMessagesStore = create<MessagesState>()(
  subscribeWithSelector((set, get) => ({
    messages: [],
    set: (messages) => {
      set({ messages });
    },
    add: (messages) => {
      set((state) => ({
        messages: [...state.messages, ...messages],
      }));
    },
    remove: (messages) => {
      set((state) => ({
        messages: state.messages.filter(
          (interceptor) => !messages.map((x) => x.id).includes(interceptor.id),
        ),
      }));
    },
    update: (message) => {
      set((state) => ({
        messages: state.messages.map((x) => {
          if (x.id === message.id) {
            return {
              ...x,
              ...message,
            };
          }
          return x;
        }),
      }));
    },
  })),
);
