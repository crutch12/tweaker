import type {
  EXTENSION_DEVTOOLS_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "../../const";

import type { ExtensionDevtoolsMessages } from "./ExtensionDevtoolsMessages";
import type { ExtensionPluginMessages } from "./ExtensionPluginMessages";

export namespace ExtensionBackgroundMessages {
  export type PluginMessages = ExtensionPluginMessages.Message & {
    target: typeof EXTENSION_DEVTOOLS_SOURCE;
    tabId: number;
  };
  export type DevtoolsMessages = ExtensionDevtoolsMessages.Message & {
    target: typeof EXTENSION_PLUGIN_SOURCE;
    tabId: number;
  };

  export type Message = PluginMessages | DevtoolsMessages;
}
