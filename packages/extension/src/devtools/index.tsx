import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./styles/index.css";
import "./styles/radix.css";

const queryClient = new QueryClient();

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Theme
          className={css`
            min-height: unset;
            container-type: inline-size;
            container-name: tweaker-devtools;
          `}
        >
          <App />
        </Theme>
      </QueryClientProvider>
    </StrictMode>,
  );
}
