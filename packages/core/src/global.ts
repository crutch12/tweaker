import type { Tweaker } from "./Tweaker";
import { EventEmitter } from "eventemitter3";

interface TweakerRegistry {
  emitter: EventEmitter<{
    created: (instance: Tweaker) => void;
  }>;
  instances: Map<string, Tweaker>;
  withInstance: typeof withInstance;
}

declare global {
  var __TWEAKER_REGISTRY__: TweakerRegistry | undefined;
}

export function getRegistry(): TweakerRegistry {
  const registry: TweakerRegistry | undefined =
    globalThis["__TWEAKER_REGISTRY__"];

  if (registry) return registry;

  const newRegistry: TweakerRegistry = {
    instances: new Map(),
    emitter: new EventEmitter(),
    withInstance,
  };

  globalThis["__TWEAKER_REGISTRY__"] = newRegistry;

  return newRegistry;
}

// init registry
getRegistry();

function emptyFn() {}

export interface WithInstanceOptions {
  timeout?: number;
}

export function withInstance<T extends Tweaker = Tweaker>(
  name: string,
  cb: (tweaker: T) => void,
  { timeout = 5000 }: WithInstanceOptions = {},
) {
  const registry = getRegistry();

  const instance = registry.instances.get(name);

  if (instance) {
    cb(instance as T);
    return emptyFn;
  }

  function handleInstance(instance: Tweaker) {
    if (instance.name === name) {
      cb(instance as T);
    }
  }

  registry.emitter.addListener("created", handleInstance);

  let timeoutId: any;

  function removeListener() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    registry.emitter.removeListener("created", handleInstance);
  }

  if (timeout && timeout > 0) {
    timeoutId = setTimeout(removeListener, timeout);
  }

  return removeListener;
}

export function registerInstance(instance: Tweaker) {
  const registry = getRegistry();
  registry.instances.set(instance.name, instance);
  registry.emitter.emit("created", instance);
}

export function unregisterInstance(instance: Tweaker) {
  const registry = getRegistry();
  registry.instances.delete(instance.name);
}
