import { create } from "zustand";
import { Intercepter } from "./InterceptersList";

interface InterceptersState {
  intercepters: Intercepter[];
  set: (intercepters: Intercepter[]) => void;
  add: (intercepters: Intercepter[]) => void;
  remove: (intercepters: Pick<Intercepter, "id">[]) => void;
  update: (intercepter: Intercepter) => void;
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
