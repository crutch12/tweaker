import { TweakerPlugin } from "@tweaker/core/plugin";
import { version, name } from "../package.json";
import {
  ExtensionMessages,
  InterceptorPayload,
  PluginMessages,
} from "./messages";
import { klona } from "klona/json";
import { Tweaker, TWEAKER_OWNER } from "@tweaker/core";
import { serializeError, isErrorLike } from "serialize-error";
import {
  registerInstance,
  notifyExtensionNewIntercept,
  notifyExtensionRemoveIntercept,
  notifyExtensionInit,
  notifyExtensionInterceptors,
} from "./global";
import {
  EXTENSION_OWNER,
  EXTENSION_PLUGIN_SOURCE,
  EXTENSION_SOURCE,
} from "./const";

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): TweakerPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;

  let expressions = new Map<number | string, string>();

  function subscribe(instance: Tweaker) {
    if (!("postMessage" in globalThis)) return;

    instance.subscribe(
      "*",
      ({ key, tweaked, originalValue, result, error, interceptorId }) => {
        const message: PluginMessages.ValueMessage = {
          source: EXTENSION_PLUGIN_SOURCE,
          version,
          type: "value",
          payload: {
            name: instance.name,
            key,
            originalValue: isErrorLike(originalValue)
              ? serializeError(originalValue)
              : klona(originalValue),
            result: isErrorLike(result)
              ? serializeError(result)
              : klona(result),
            timestamp: Date.now(),
            tweaked,
            error: error ?? false,
            interceptorId,
          },
        };
        globalThis.postMessage(message, "*");
      },
      { mode: "all" },
    );

    _instance.on("intercept.new", (listener) => {
      if (listener.owner === TWEAKER_OWNER) {
        notifyExtensionNewIntercept(_instance, listener);
      }
    });

    _instance.on("intercept.remove", (listener) => {
      if (listener.owner === TWEAKER_OWNER) {
        notifyExtensionRemoveIntercept(_instance, listener);
      }
    });
  }

  function start() {
    if (!("addEventListener" in globalThis)) return;
    if (!("postMessage" in globalThis)) return;

    function notify(type: "ping" | "pong") {
      const message: PluginMessages.PingMessage | PluginMessages.PongMessage = {
        source: EXTENSION_PLUGIN_SOURCE,
        version,
        type,
        payload: {
          name: _instance.name,
          timestamp: Date.now(),
        },
      };
      globalThis.postMessage(message, "*");
    }

    function getListeners(): InterceptorPayload<unknown>[] {
      return _instance.getListeners().map((listener) => {
        const expression = expressions.get(listener.id);
        return {
          id: listener.id,
          staticId: listener.staticId,
          name: _instance.name,
          patterns: listener.patterns,
          interactive: listener.interactive,
          owner: listener.owner,
          enabled: listener.enabled,
          timestamp: listener.timestamp,
          expression,
          sourceCode: expression ? undefined : String(listener.handler).trim(),
          stack: listener.stack,
        };
      });
    }

    function ready() {
      console.log("tweaker extension plugin is ready");
      // notifyExtensionInit(_instance, getListeners());
    }

    const promise = new Promise<void>((resolve) => {
      notify("ping");
      const handler = (event: MessageEvent<ExtensionMessages.Message>) => {
        if (!event.data || event.data.source !== EXTENSION_SOURCE) {
          return;
        }

        if (event.data.type === "ping" || event.data.type === "pong") {
          notifyExtensionInit(_instance, getListeners());
        }

        if (event.data.type === "init") {
          handleInterceptors(event.data.payload.interceptors);
          globalThis.removeEventListener("message", handler);
          resolve();
        }
      };
      globalThis.addEventListener("message", handler);
    }).then(() => ready());

    promises.push(promise);

    function handleInterceptors(
      interceptors: ExtensionMessages.InitMessage["payload"]["interceptors"],
    ) {
      const listeners = _instance.getListeners();

      for (const listener of listeners) {
        if (listener.owner === EXTENSION_OWNER) {
          _instance.removeListener(listener.id);
        }
      }

      for (const listener of interceptors) {
        if (listener.owner !== EXTENSION_OWNER) {
          continue;
        }

        expressions.delete(listener.id);
        if (_instance.hasListener(listener.id)) {
          _instance.removeListener(listener.id);
        }
        expressions.set(listener.id, listener.expression ?? "");
        _instance.intercept(
          listener.patterns,
          (key, value) => {
            return new Function("key", "value", listener.expression ?? "")(
              key,
              value,
            );
          },
          {
            id: listener.id,
            owner: listener.owner,
            interactive: listener.interactive,
            enabled: listener.enabled,
          },
        );
      }
    }

    globalThis.addEventListener(
      "message",
      (event: MessageEvent<ExtensionMessages.Message>) => {
        if (event.data && event.data.source === EXTENSION_SOURCE) {
          // debugger;
          console.log(event.data.payload);
          switch (event.data.type) {
            case "interceptors": {
              handleInterceptors(event.data.payload.data);
              break;
            }
            case "ping":
            case "pong": {
              notifyExtensionInterceptors(getListeners());
              break;
            }
          }
        }
      },
    );
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
