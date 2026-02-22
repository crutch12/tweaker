import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TweakerDevTools } from "@tweaker/devtools-ui";

export interface RenderWidgetOptions {}

export function renderWidget(
  container: HTMLElement,
  {}: RenderWidgetOptions = {},
) {
  if (!container) throw new Error("container is required");

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <TweakerDevTools container={container} />
    </StrictMode>,
  );

  return () => {
    root.unmount();
  };
}
