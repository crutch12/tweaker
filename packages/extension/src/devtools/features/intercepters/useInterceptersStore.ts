import { create } from "zustand";
import { ExtensionIntercepter } from "./InterceptersList";

interface InterceptersState {
  intercepters: ExtensionIntercepter[];
  set: (intercepters: ExtensionIntercepter[]) => void;
  add: (intercepters: ExtensionIntercepter[]) => void;
  remove: (intercepters: Pick<ExtensionIntercepter, "id">[]) => void;
  update: (intercepter: ExtensionIntercepter) => void;
}

export const useInterceptersStore = create<InterceptersState>((set, get) => ({
  intercepters: [],
  set: (intercepters) => {
    set({ intercepters });
  },
  add: (intercepters) => {
    set((state) => ({
      intercepters: [...state.intercepters, ...intercepters],
    }));
  },
  remove: (intercepters) => {
    set((state) => ({
      intercepters: state.intercepters.filter(
        (intercepter) =>
          !intercepters.map((x) => x.id).includes(intercepter.id),
      ),
    }));
  },
  update: (intercepter) => {
    set((state) => ({
      intercepters: state.intercepters.map((x) => {
        if (x.id === intercepter.id) {
          return intercepter;
        }
        return x;
      }),
    }));
  },
}));
