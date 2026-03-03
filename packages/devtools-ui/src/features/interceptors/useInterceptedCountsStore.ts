import { create } from "zustand";
import { InterceptorId } from "@tweaker/core";
import { subscribeWithSelector } from "zustand/middleware";

interface InterceptedCountsState {
  interceptedCounts: Map<InterceptorId, number>;
  set: (id: InterceptorId, count: number) => void;
  remove: (id: InterceptorId) => void;
}

export const useInterceptedCountsStore = create<InterceptedCountsState>()(
  subscribeWithSelector((set, get) => ({
    interceptedCounts: new Map(),
    interceptors: [],
    set: (id, count) => {
      const interceptedCounts = get().interceptedCounts;
      interceptedCounts.set(id, count);
      set({ interceptedCounts: new Map(interceptedCounts) });
    },
    remove: (id) => {
      const interceptedCounts = get().interceptedCounts;
      interceptedCounts.delete(id);
      set({ interceptedCounts: new Map(interceptedCounts) });
    },
  })),
);
