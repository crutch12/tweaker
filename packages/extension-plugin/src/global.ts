import { Tweaker, TweakerInterceptor } from "@tweaker/core";
import { version } from "../package.json";
import { InterceptorPayload } from "./types";
import { sendMessageToExtension } from "./sendMessageToExtension";

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
  sendMessageToExtension("init", {
    name: instance.name,
    enabled: instance.enabled,
    interceptors,
    timestamp: Date.now(),
  });
}

export function notifyExtensionInterceptors<T>(
  listeners: InterceptorPayload<unknown>[],
) {
  sendMessageToExtension("interceptors", listeners);
}

export function notifyExtensionNewIntercept<T>(
  instance: Tweaker,
  listener: TweakerInterceptor<T>,
) {
  sendMessageToExtension("new-intercept", {
    id: listener.id,
    name: instance.name,
    patterns: listener.patterns,
    interactive: listener.interactive,
    owner: listener.owner,
    timestamp: listener.timestamp,
    enabled: listener.enabled,
    sourceCode: String(listener.handler).trim(),
    stack: listener.stack,
  });
}

export function notifyExtensionRemoveIntercept<T>(
  instance: Tweaker,
  listener: TweakerInterceptor<T>,
) {
  sendMessageToExtension("remove-intercept", {
    name: instance.name,
    id: listener.id,
  });
}
