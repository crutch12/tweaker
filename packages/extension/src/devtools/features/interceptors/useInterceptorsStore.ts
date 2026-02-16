import { create } from "zustand";
import { ExtensionInterceptor } from "./InterceptorsList";

interface InterceptorsState {
  interceptors: ExtensionInterceptor[];
  set: (interceptors: ExtensionInterceptor[]) => void;
  add: (interceptors: ExtensionInterceptor[]) => void;
  remove: (interceptors: Pick<ExtensionInterceptor, "id">[]) => void;
  update: (interceptor: ExtensionInterceptor) => void;
}

export const useInterceptorsStore = create<InterceptorsState>((set, get) => ({
  interceptors: [],
  set: (interceptors) => {
    set({ interceptors });
  },
  add: (interceptors) => {
    set((state) => ({
      interceptors: [...state.interceptors, ...interceptors],
    }));
  },
  remove: (interceptors) => {
    set((state) => ({
      interceptors: state.interceptors.filter(
        (interceptor) =>
          !interceptors.map((x) => x.id).includes(interceptor.id),
      ),
    }));
  },
  update: (interceptor) => {
    set((state) => ({
      interceptors: state.interceptors.map((x) => {
        if (x.id === interceptor.id) {
          return interceptor;
        }
        return x;
      }),
    }));
  },
}));
