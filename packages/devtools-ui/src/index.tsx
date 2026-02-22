import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";
import cn from "classnames";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";
import { ContainerQueryRootClassName } from "./components/container-query/styles";
import { DefaultScrollbarClassName } from "./utils/styles";

import "./styles/index.css";
import "@tweaker/styles/radix-ui.css";

const queryClient = new QueryClient();

export function TweakerDevTools() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContainerQueryRootProvider>
        <Theme
          className={cn(
            css`
              min-height: unset;
            `,
            DefaultScrollbarClassName,
            ContainerQueryRootClassName,
          )}
        >
          <App />
        </Theme>
      </ContainerQueryRootProvider>
    </QueryClientProvider>
  );
}
