import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Example } from "./Example";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <Example />
    </StrictMode>,
  );
}
