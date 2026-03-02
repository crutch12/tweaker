import { createContext, ReactNode, useContext, useMemo } from "react";

export interface DevtoolsContextProps {
  tabId?: number;
  canViewSourceCode: boolean;
  viewSourceCode: (file: string, line: number, column: number) => void;
}

const DevtoolsContext = createContext<DevtoolsContextProps>({
  tabId: undefined,
  canViewSourceCode: false,
  viewSourceCode: () => {},
});

export function DevtoolsContextProvider({
  children,
  tabId,
  canViewSourceCode,
  viewSourceCode,
}: DevtoolsContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      tabId,
      canViewSourceCode,
      viewSourceCode,
    }),
    [tabId, canViewSourceCode, viewSourceCode],
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
