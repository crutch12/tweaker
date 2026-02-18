import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { Global } from "@emotion/react";

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
            * {
              scrollbar-width: thin;
            }
          `}
        >
          <App />
          <Global
            styles={{
              "[data-radix-popper-content-wrapper]": {
                scrollbarWidth: "thin",
                "*": {
                  scrollbarWidth: "thin",
                },
              },
            }}
          />
        </Theme>
      </QueryClientProvider>
    </StrictMode>,
  );
}
