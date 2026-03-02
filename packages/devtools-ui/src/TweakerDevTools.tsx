import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

export interface TweakerDevToolsProps {
  container?: HTMLElement;
  tabId?: number;
  canViewSourceCode?: DevtoolsContextProps["canViewSourceCode"];
  viewSourceCode?: DevtoolsContextProps["viewSourceCode"];
}

export function TweakerDevTools({
  container,
  tabId,
  viewSourceCode,
  canViewSourceCode,
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
        >
          <ContainerQueryRootProvider documentNode={documentNode}>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </ContainerQueryRootProvider>
        </DevtoolsContextProvider>
      </ColorSchemeProvider>
    </QueryClientProvider>
  );
}
