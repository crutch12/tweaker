import { createContext, ReactNode, useContext, useMemo } from "react";

export interface DevtoolsContextProps {
  tabId?: number;
  canViewSourceCode: boolean;
  viewSourceCode: (file: string, line: number, column: number) => void;
  reloadApp: () => void;
  url?: string;
  canReinstallExtension?: boolean;
}

const DevtoolsContext = createContext<DevtoolsContextProps>({
  tabId: undefined,
  canViewSourceCode: false,
  viewSourceCode: () => {},
  reloadApp: () => {},
  url: undefined,
  canReinstallExtension: false,
});

export function DevtoolsContextProvider({
  children,
  tabId,
  canViewSourceCode,
  viewSourceCode,
  reloadApp,
  url,
  canReinstallExtension,
}: DevtoolsContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      tabId,
      canViewSourceCode,
      viewSourceCode,
      reloadApp,
      url,
      canReinstallExtension,
    }),
    [
      tabId,
      canViewSourceCode,
      viewSourceCode,
      reloadApp,
      url,
      canReinstallExtension,
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
