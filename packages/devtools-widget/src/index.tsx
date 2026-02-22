import { createRoot } from "react-dom/client";
import { TweakerDevTools } from "@tweaker/devtools-ui";

export interface RenderWidgetOptions {
  includeStyles?: string[];
}

export function renderWidget(
  container: HTMLElement,
  { includeStyles = [] }: RenderWidgetOptions = {},
) {
  if (!container) throw new Error("container is required");

  const shadowRoot = container.attachShadow({ mode: "open" });
  const reactRoot = document.createElement("div");
  shadowRoot.appendChild(reactRoot);

  if (includeStyles) {
    includeStyles.forEach((style) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.crossOrigin = "";
      link.href = style;
      shadowRoot.appendChild(link);
    });
  } else {
    import("./styles");
  }

  const root = createRoot(reactRoot);
  root.render(<TweakerDevTools container={reactRoot} />);

  return () => {
    root.unmount();
  };
}
