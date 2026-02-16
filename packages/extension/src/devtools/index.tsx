import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Theme style={{ minHeight: "unset" }}>
          <App />
        </Theme>
      </QueryClientProvider>
    </StrictMode>,
  );
}
