import type { Tweaker } from "@tweaker/core";
import { version } from "../package.json";

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
