import type { RenderWidgetOptions } from "@tweaker/devtools-widget";

declare global {
  interface Window {
    __TWEAKER_DEVTOOLS__?: {
      canViewSourceCode: RenderWidgetOptions["canViewSourceCode"];
      viewSourceCode: RenderWidgetOptions["viewSourceCode"];
      url?: RenderWidgetOptions["url"];
    };
  }
}
