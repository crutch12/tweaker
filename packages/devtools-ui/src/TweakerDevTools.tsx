import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";

import "./styles/index.css";
import { useMemo } from "react";
import { ColorSchemeProvider } from "./components/theme/ColorSchemeProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";

const queryClient = new QueryClient();

export interface TweakerDevToolsProps {
  container?: HTMLElement;
}

export function TweakerDevTools({ container }: TweakerDevToolsProps) {
  const documentNode = useMemo(() => {
    return container?.getRootNode() as Document;
  }, [container]);
  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeProvider>
        <ContainerQueryRootProvider documentNode={documentNode}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ContainerQueryRootProvider>
      </ColorSchemeProvider>
    </QueryClientProvider>
  );
}
