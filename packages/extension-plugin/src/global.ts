import { Tweaker, TweakListener } from "@tweaker/core";
import { version } from "../package.json";
import { PluginMessages } from "./messages";

declare global {
  var __TWEAKER__: {
    version: string;
    instances: Record<string, Tweaker>;
  };
}

function getGlobalRegistry() {
  if (!globalThis.__TWEAKER__) {
    globalThis.__TWEAKER__ = {
      version,
      instances: {},
    };
  }
  return globalThis.__TWEAKER__;
}

export function registerInstance(instance: Tweaker) {
  const registry = getGlobalRegistry();
  registry.instances[instance.name] = instance;
}

export function notifyExtensionNewIntercept<T>(
  instance: Tweaker,
  listener: TweakListener<T>,
) {
  if ("postMessage" in globalThis) {
    const message: PluginMessages.NewInterceptMessage = {
      source: "@tweaker/extension-plugin",
      version,
      type: "new-intercept",
      payload: {
        id: listener.id,
        name: instance.name,
        patterns: listener.patterns,
        interactive: listener.interactive,
      },
    };
    globalThis.postMessage(message);
  }
}

export function notifyExtensionRemoveIntercept<T>(
  instance: Tweaker,
  listener: TweakListener<T>,
) {
  if ("postMessage" in globalThis) {
    const message: PluginMessages.RemoveInterceptMessage = {
      source: "@tweaker/extension-plugin",
      version,
      type: "remove-intercept",
      payload: {
        name: instance.name,
        id: listener.id,
      },
    };
    globalThis.postMessage(message);
  }
}
