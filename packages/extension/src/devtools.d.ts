import type { RenderWidgetOptions } from "@tweaker/devtools-widget";

declare global {
  interface Window {
    __TWEAKER_DEVTOOLS_?: {
      canViewSourceCode: RenderWidgetOptions["canViewSourceCode"];
      viewSourceCode: RenderWidgetOptions["viewSourceCode"];
    };
  }
}
