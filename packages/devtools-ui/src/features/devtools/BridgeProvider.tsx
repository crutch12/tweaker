import { Bridge } from "@tweaker/extension-plugin";
import { createContext, ReactNode, useContext, useMemo } from "react";

const NOT_PROVIDED = "Bridge is not provided!";

export interface BridgeContextProps {
  bridge: Bridge;
}

const BridgeContext = createContext<BridgeContextProps>({
  bridge: {
    sendMessageToPlugin: () => Promise.reject(NOT_PROVIDED),
    sendMessageToExtension: () => Promise.reject(NOT_PROVIDED),
    onPluginMessage: () => {
      throw new Error(NOT_PROVIDED);
    },
    onExtensionMessage: () => {
      throw new Error(NOT_PROVIDED);
    },
  },
});

export function BridgeContextProvider({
  bridge,
  children,
}: BridgeContextProps & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      bridge,
    }),
    [bridge],
  );

  return (
    <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>
  );
}

export function useBridge() {
  return useContext(BridgeContext);
}
