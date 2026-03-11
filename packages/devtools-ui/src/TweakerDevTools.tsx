import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./features/app/App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";

import "./styles/index.css";
import { useMemo, lazy, Suspense } from "react";
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

const Toaster = lazy(() =>
  import("./libs/sonner").then((r) => ({ default: r.Toaster })),
);

export interface TweakerDevToolsProps {
  container?: HTMLElement;
  tabId?: number;
  reinstallExtension?: DevtoolsContextProps["reinstallExtension"];
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
  reinstallExtension,
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
          reinstallExtension={reinstallExtension}
        >
          <ContainerQueryRootProvider documentNode={documentNode}>
            <ThemeProvider>
              <App />
              <Suspense>
                <Toaster
                  toastOptions={{
                    unstyled: true,
                  }}
                />
              </Suspense>
            </ThemeProvider>
          </ContainerQueryRootProvider>
        </DevtoolsContextProvider>
      </ColorSchemeProvider>
    </QueryClientProvider>
  );
}
