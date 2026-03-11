import { bridge } from "./bridge";
import { InterceptorPayload } from "./types";
import { Tweaker, TweakerInterceptor, TweakerKey } from "@tweaker/core";

export function notifyExtensionInit<T>(
  instance: Tweaker,
  interceptors: InterceptorPayload[],
) {
  bridge.sendMessageToExtension("init", {
    name: instance.name,
    enabled: instance.enabled,
    interceptors,
    timestamp: Date.now(),
  });
}

export function notifyExtensionInterceptors<T>(
  listeners: InterceptorPayload[],
) {
  bridge.sendMessageToExtension("interceptors", listeners);
}

export function notifyExtensionNewIntercept<T>(
  instance: Tweaker,
  listener: TweakerInterceptor<TweakerKey, T>,
) {
  bridge.sendMessageToExtension("new-intercept", {
    id: listener.id,
    name: instance.name,
    type: listener.type,
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
  bridge.sendMessageToExtension("remove-intercept", {
    name: instance.name,
    id: listener.id,
  });
}
