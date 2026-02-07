import { Tweaker } from "./Tweaker";
import { version } from "../package.json";
import {
  TweakerNewInterceptMessage,
  TweakerRemoveInterceptMessage,
  TweakListener,
} from "./types";

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

    if ("addEventListener" in globalThis) {
      globalThis.addEventListener("message", (event) => {
        if (event.data && event.data.source === "@tweaker/extension") {
          console.log(event.data.payload);
        }
      });
    }
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
    const message: TweakerNewInterceptMessage = {
      source: "@tweaker/core",
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
    const message: TweakerRemoveInterceptMessage = {
      source: "@tweaker/core",
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
