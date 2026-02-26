import { Tweaker, TweakerInterceptor } from "@tweaker/core";
import { version } from "../package.json";
import { ExtensionPluginMessages } from "./messages/types";
import { InterceptorPayload } from "./types";
import { EXTENSION_PLUGIN_SOURCE } from "./const";

declare global {
  var __TWEAKER_DEVTOOLS_GLOBAL_HOOK__: {
    version: string;
    instances: Map<string, Tweaker>;
  };
}

function getGlobalRegistry() {
  if (!globalThis.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__) {
    globalThis.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__ = {
      version,
      instances: new Map(),
    };
  }
  return globalThis.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__;
}

export function registerInstance(instance: Tweaker) {
  const registry = getGlobalRegistry();
  registry.instances.set(instance.name, instance);
}

export function notifyExtensionInit<T>(
  instance: Tweaker,
  interceptors: InterceptorPayload<unknown>[],
) {
  if ("postMessage" in globalThis) {
    const message: ExtensionPluginMessages.InitMessage = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type: "init",
      payload: {
        name: instance.name,
        enabled: instance.enabled,
        interceptors,
        timestamp: Date.now(),
      },
    };
    globalThis.postMessage(message, "*");
  }
}

export function notifyExtensionInterceptors<T>(
  listeners: InterceptorPayload<unknown>[],
) {
  if ("postMessage" in globalThis) {
    const message: ExtensionPluginMessages.InterceptorsMessage = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type: "interceptors",
      payload: listeners,
    };
    globalThis.postMessage(message, "*");
  }
}

export function notifyExtensionNewIntercept<T>(
  instance: Tweaker,
  listener: TweakerInterceptor<T>,
) {
  if ("postMessage" in globalThis) {
    const message: ExtensionPluginMessages.NewInterceptMessage = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type: "new-intercept",
      payload: {
        id: listener.id,
        name: instance.name,
        patterns: listener.patterns,
        interactive: listener.interactive,
        owner: listener.owner,
        timestamp: listener.timestamp,
        enabled: listener.enabled,
        sourceCode: String(listener.handler).trim(),
        stack: listener.stack,
      },
    };
    globalThis.postMessage(message, "*");
  }
}

export function notifyExtensionRemoveIntercept<T>(
  instance: Tweaker,
  listener: TweakerInterceptor<T>,
) {
  if ("postMessage" in globalThis) {
    const message: ExtensionPluginMessages.RemoveInterceptMessage = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type: "remove-intercept",
      payload: {
        name: instance.name,
        id: listener.id,
      },
    };
    globalThis.postMessage(message, "*");
  }
}
