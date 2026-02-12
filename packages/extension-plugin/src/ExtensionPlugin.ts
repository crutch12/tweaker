import { TweakerPlugin } from "@tweaker/core/plugin";
import { version, name } from "../package.json";
import { ExtensionMessages, PluginMessages } from "./messages";
import { klona } from "klona/json";
import { Tweaker } from "@tweaker/core";
import {
  registerInstance,
  notifyExtensionNewIntercept,
  notifyExtensionRemoveIntercept,
  notifyExtensionInit,
  notifyExtensionIntercepters,
} from "./global";

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): TweakerPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;

  function subscribe(instance: Tweaker) {
    if (!("postMessage" in globalThis)) return;

    instance.subscribe(
      "*",
      (key, tweaked, originalValue, result) => {
        const message: PluginMessages.ValueMessage = {
          source: "@tweaker/extension-plugin",
          version,
          type: "value",
          payload: {
            name: instance.name,
            key,
            originalValue: klona(originalValue),
            result: klona(result),
            timestamp: Date.now(),
            tweaked,
          },
        };
        globalThis.postMessage(message, "*");
      },
      { mode: "all" },
    );

    _instance.on("intercept.new", (listener) => {
      notifyExtensionNewIntercept(_instance, listener);
    });

    _instance.on("intercept.remove", (listener) => {
      notifyExtensionRemoveIntercept(_instance, listener);
    });
  }

  function start() {
    if (!("addEventListener" in globalThis)) return;
    if (!("postMessage" in globalThis)) return;

    function notify(type: "ping" | "pong") {
      const message: PluginMessages.PingMessage | PluginMessages.PongMessage = {
        source: "@tweaker/extension-plugin",
        version,
        type,
        payload: {
          name: _instance.name,
          timestamp: Date.now(),
        },
      };
      globalThis.postMessage(message, "*");
    }

    function init() {
      notifyExtensionInit(_instance);
      notifyExtensionIntercepters(_instance, _instance.getListeners());
    }

    const promise = new Promise<void>((resolve) => {
      notify("ping");
      const handler = (
        event: MessageEvent<
          ExtensionMessages.PongMessage | ExtensionMessages.PingMessage
        >,
      ) => {
        if (
          event.data &&
          event.data.source === "@tweaker/extension" &&
          event.data.type === "ping"
        ) {
          notify("pong");
          globalThis.removeEventListener("message", handler);
          resolve();
        }

        if (
          event.data &&
          event.data.source === "@tweaker/extension" &&
          event.data.type === "pong"
        ) {
          globalThis.removeEventListener("message", handler);
          resolve();
        }
      };
      globalThis.addEventListener("message", handler);
    }).then(() => init());

    promises.push(promise);

    globalThis.addEventListener("message", (event) => {
      if (event.data && event.data.source === "@tweaker/extension") {
        // debugger;
        console.log(event.data.payload);
      }
    });
  }

  return {
    name,
    version,
    setup: (instance) => {
      _instance = instance;
      registerInstance(instance);
      subscribe(instance);
      start();
    },
    ready: async () => {
      await Promise.all(promises);
    },
  };
}
