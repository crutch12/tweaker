import { createContext, ReactNode, useContext, useMemo } from "react";

export interface DevtoolsContextProps {
  tabId?: number;
  canViewSourceCode: boolean;
  viewSourceCode: (file: string, line: number, column: number) => void;
  reloadApp: () => void;
  url?: string;
  reinstallExtension?: () => void;
}

const DevtoolsContext = createContext<DevtoolsContextProps>({
  tabId: undefined,
  canViewSourceCode: false,
  viewSourceCode: () => {},
  reloadApp: () => {},
  url: undefined,
  reinstallExtension: undefined,
});

export function DevtoolsContextProvider({
  children,
  tabId,
  canViewSourceCode,
  viewSourceCode,
  reloadApp,
  url,
  reinstallExtension,
}: DevtoolsContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      tabId,
      canViewSourceCode,
      viewSourceCode,
      reloadApp,
      url,
      reinstallExtension,
    }),
    [
      tabId,
      canViewSourceCode,
      viewSourceCode,
      reloadApp,
      url,
      reinstallExtension,
    ],
  );

  return (
    <DevtoolsContext.Provider value={value}>
      {children}
    </DevtoolsContext.Provider>
  );
}

export function useDevtools() {
  return useContext(DevtoolsContext);
}
