import { TweakerDevTools } from "@tweaker/devtools-ui";
import "@tweaker/devtools-ui/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <TweakerDevTools />
    </StrictMode>,
  );
}
