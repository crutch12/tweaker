import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TweakerDevTools, TweakerDevToolsProps } from "@tweaker/devtools-ui";

export interface RenderWidgetOptions {
  tabId?: number;
  canViewSourceCode?: TweakerDevToolsProps["canViewSourceCode"];
  viewSourceCode?: TweakerDevToolsProps["viewSourceCode"];
}

export function renderWidget(
  container: HTMLElement,
  { tabId, canViewSourceCode, viewSourceCode }: RenderWidgetOptions = {},
) {
  if (!container) throw new Error("container is required");

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <TweakerDevTools
        container={container}
        tabId={tabId}
        canViewSourceCode={canViewSourceCode}
        viewSourceCode={viewSourceCode}
      />
    </StrictMode>,
  );

  return () => {
    root.unmount();
  };
}
