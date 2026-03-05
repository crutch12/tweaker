import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { App } from "./App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";

import "./styles/index.css";
import { useMemo } from "react";
import { ColorSchemeProvider } from "./components/theme/ColorSchemeProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import {
  DevtoolsContextProps,
  DevtoolsContextProvider,
} from "./features/devtools/DevtoolsProvider";

const queryClient = new QueryClient();

const emptyFn = () => {};

const reloadWindow = () => {
  window.location.reload();
};

export interface TweakerDevToolsProps {
  container?: HTMLElement;
  tabId?: number;
  canReinstallExtension?: boolean;
  canViewSourceCode?: DevtoolsContextProps["canViewSourceCode"];
  viewSourceCode?: DevtoolsContextProps["viewSourceCode"];
  reloadApp?: DevtoolsContextProps["reloadApp"];
  url?: DevtoolsContextProps["url"];
}

export function TweakerDevTools({
  container,
  tabId,
  viewSourceCode,
  canViewSourceCode,
  reloadApp,
  url,
  canReinstallExtension,
}: TweakerDevToolsProps) {
  const documentNode = useMemo(() => {
    return container?.getRootNode() as Document;
  }, [container]);
  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeProvider>
        <DevtoolsContextProvider
          tabId={tabId}
          viewSourceCode={viewSourceCode ?? emptyFn}
          canViewSourceCode={canViewSourceCode ?? false}
          reloadApp={reloadApp ?? reloadWindow}
          url={url}
          canReinstallExtension={canReinstallExtension}
        >
          <ContainerQueryRootProvider documentNode={documentNode}>
            <ThemeProvider>
              <App />
              <Toaster
                toastOptions={{
                  unstyled: true,
                }}
              />
            </ThemeProvider>
          </ContainerQueryRootProvider>
        </DevtoolsContextProvider>
      </ColorSchemeProvider>
    </QueryClientProvider>
  );
}
