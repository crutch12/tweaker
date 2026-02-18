import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
          `}
        >
          <App />
        </Theme>
      </QueryClientProvider>
    </StrictMode>,
  );
}
