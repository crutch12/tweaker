import { Tweaker } from "./Tweaker";

declare global {
  var __TWEAKER__: {
    instances: Record<string, Tweaker>;
  };
}

function getGlobalRegistry() {
  if (!globalThis.__TWEAKER__) {
    globalThis.__TWEAKER__ = {
      instances: {},
    };
  }
  return globalThis.__TWEAKER__;
}

export function registerInstance(instance: Tweaker) {
  const registry = getGlobalRegistry();
  registry.instances[instance.name] = instance;
}
