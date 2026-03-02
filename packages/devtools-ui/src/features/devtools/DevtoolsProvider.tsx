import { createContext, ReactNode, useContext, useMemo } from "react";

interface DevtoolsContextProps {
  tabId?: number;
}

const DevtoolsContext = createContext<DevtoolsContextProps>({
  tabId: undefined,
});

export function DevtoolsContextProvider({
  children,
  tabId,
}: DevtoolsContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      tabId,
    }),
    [tabId],
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
