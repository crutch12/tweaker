import { Tweaker } from "./Tweaker";
import { version } from "../package.json";

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
