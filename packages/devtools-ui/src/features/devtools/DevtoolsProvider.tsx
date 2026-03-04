import { createContext, ReactNode, useContext, useMemo } from "react";

export interface DevtoolsContextProps {
  tabId?: number;
  canViewSourceCode: boolean;
  viewSourceCode: (file: string, line: number, column: number) => void;
  reloadApp: () => void;
  url?: string;
}

const DevtoolsContext = createContext<DevtoolsContextProps>({
  tabId: undefined,
  canViewSourceCode: false,
  viewSourceCode: () => {},
  reloadApp: () => {},
  url: undefined,
});

export function DevtoolsContextProvider({
  children,
  tabId,
  canViewSourceCode,
  viewSourceCode,
  reloadApp,
  url,
}: DevtoolsContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      tabId,
      canViewSourceCode,
      viewSourceCode,
      reloadApp,
      url,
    }),
    [tabId, canViewSourceCode, viewSourceCode, reloadApp, url],
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
