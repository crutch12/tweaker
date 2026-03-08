import type { EXTENSION_APP_SOURCE } from "../../const";

export namespace ExtensionAppMessages {
  export type ReinstallMessage = {
    type: "extension:reinstall";
    source: typeof EXTENSION_APP_SOURCE;
    tabId: number;
  };

  export type Message = ReinstallMessage;
}
