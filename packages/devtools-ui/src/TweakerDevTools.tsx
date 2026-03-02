import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";

import "./styles/index.css";
import { useMemo } from "react";
import { ColorSchemeProvider } from "./components/theme/ColorSchemeProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { DevtoolsContextProvider } from "./features/devtools/DevtoolsProvider";

const queryClient = new QueryClient();

export interface TweakerDevToolsProps {
  container?: HTMLElement;
  tabId?: number;
}

export function TweakerDevTools({ container, tabId }: TweakerDevToolsProps) {
  const documentNode = useMemo(() => {
    return container?.getRootNode() as Document;
  }, [container]);
  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeProvider>
        <DevtoolsContextProvider tabId={tabId}>
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
