import { Tweaker, TweakerInterceptor } from "@tweaker/core";
import { version } from "../package.json";
import { InterceptorPayload, PluginMessages } from "./messages";
import { EXTENSION_PLUGIN_SOURCE } from "./const";

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

export function notifyExtensionInit<T>(
  instance: Tweaker,
  interceptors: InterceptorPayload<unknown>[],
) {
  if ("postMessage" in globalThis) {
    const message: PluginMessages.InitMessage = {
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
    const message: PluginMessages.InterceptorsMessage = {
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
    const message: PluginMessages.NewInterceptMessage = {
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
    const message: PluginMessages.RemoveInterceptMessage = {
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
