import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TweakerDevTools, TweakerDevToolsProps } from "@tweaker/devtools-ui";

export interface RenderWidgetOptions {
  tabId?: number;
  reinstallExtension?: TweakerDevToolsProps["reinstallExtension"];
  canViewSourceCode?: TweakerDevToolsProps["canViewSourceCode"];
  viewSourceCode?: TweakerDevToolsProps["viewSourceCode"];
  url?: TweakerDevToolsProps["url"];
  bridge: TweakerDevToolsProps["bridge"];
}

export function renderWidget(
  container: HTMLElement,
  {
    tabId,
    canViewSourceCode,
    viewSourceCode,
    url,
    reinstallExtension,
    bridge,
  }: RenderWidgetOptions,
) {
  if (!container) throw new Error("container is required");

  function mount() {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <TweakerDevTools
          container={container}
          tabId={tabId}
          canViewSourceCode={canViewSourceCode}
          viewSourceCode={viewSourceCode}
          reloadApp={reloadApp}
          url={url}
          reinstallExtension={reinstallExtension}
          bridge={bridge}
        />
      </StrictMode>,
    );
    return root;
  }

  let root = mount();

  function reloadApp() {
    root.unmount();
    root = mount();
  }

  return () => {
    root.unmount();
  };
}
