import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";
import cn from "classnames";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";
import { ContainerQueryRootProvider } from "./components/container-query/ContainerQueryRootProvider";
import { ContainerQueryRootClassName } from "./components/container-query/styles";
import { DefaultScrollbarClassName } from "./utils/styles";

import "./styles/index.css";

const queryClient = new QueryClient();

export interface TweakerDevToolsProps {
  container?: HTMLElement;
}

export function TweakerDevTools({ container }: TweakerDevToolsProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ContainerQueryRootProvider
        documentNode={container?.getRootNode() as Document}
      >
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
