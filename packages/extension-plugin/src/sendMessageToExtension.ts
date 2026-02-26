import { version } from "../package.json";
import { EXTENSION_PLUGIN_SOURCE } from "./const";
import { ExtensionPluginMessages } from "./messages/types";
import { InterceptorPayload } from "./types";
import { Tweaker, TweakerInterceptor, TweakerKey } from "@tweaker/core";

/**
 * Devtools App -> Tweaker (plugin)
 * @param type
 * @param payload
 */
export function sendMessageToExtension<
  T extends ExtensionPluginMessages.Message["type"],
>(
  type: T,
  payload: Extract<ExtensionPluginMessages.Message, { type: T }>["payload"],
) {
  if ("postMessage" in globalThis) {
    const message = {
      source: EXTENSION_PLUGIN_SOURCE,
      version,
      type,
      payload,
    } as ExtensionPluginMessages.Message;
    globalThis.postMessage(message, "*");
  }
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
  listener: TweakerInterceptor<TweakerKey, T>,
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
  listener: TweakerInterceptor<TweakerKey, T>,
) {
  sendMessageToExtension("remove-intercept", {
    name: instance.name,
    id: listener.id,
  });
}
