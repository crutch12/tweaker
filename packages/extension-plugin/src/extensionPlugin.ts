import { TweakerPlugin } from "@tweaker/core/plugin";
import { generateNumberId, generateStringId } from "@tweaker/core/utils";
import { version, name } from "../package.json";
import { ExtensionDevtoolsMessages } from "./messages/types";
import {
  Tweaker,
  TWEAKER_OWNER,
  InterceptorId,
  TweakerValueType,
  TweakHandler,
} from "@tweaker/core";
import { registerInstance } from "./global";
import { EXTENSION_OWNER } from "./const";
import type { InterceptorPayload } from "./types";
import {
  sendMessageToExtension,
  notifyExtensionNewIntercept,
  notifyExtensionRemoveIntercept,
  notifyExtensionInit,
  notifyExtensionInterceptors,
} from "./sendMessageToExtension";
import { isForPluginMessage } from "./messages";
import { clone } from "./clone";

function getHandler(
  type: TweakerValueType,
  data: InterceptorPayload<unknown>["data"],
): TweakHandler<string, any> {
  switch (type) {
    case "default": {
      return (key, value, ctx) => {
        return new Function("key", "value", "ctx", data?.expression ?? "")(
          key,
          value,
          ctx,
        );
      };
    }
    case "fetch": {
      return (key, response: Response, ctx) => {
        if (ctx.type !== "fetch") return ctx.bypass;
        return new Proxy(response, {
          get(target, prop: keyof typeof response) {
            const value = target[prop];

            if (typeof value === "function") {
              // We only care about body-reading methods
              const bodyMethods = [
                "json",
                "text",
                "blob",
                "formData",
                "arrayBuffer",
              ];

              if (bodyMethods.includes(prop) && data?.[prop]?.static) {
                return async function (...methodArgs: any) {
                  try {
                    // @ts-expect-error
                    const result = await value.apply(target, methodArgs);
                    const mock = data[prop].static;
                    if (mock) {
                      if (prop === "json") {
                        return JSON.parse(mock);
                      }
                      return mock;
                    }
                    return result;
                  } catch (err) {
                    console.error(`Fetch error in .${prop}():`, err);
                    throw err; // Re-throw so the app can handle the error
                  }
                };
              }
              // Bind other methods (like .clone()) to the original response
              return value.bind(target);
            }

            return value;
          },
        });
      };
    }
  }
}

interface ExtensionPlugin extends TweakerPlugin {
  getTabId: () => Promise<number | undefined>;
}

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): ExtensionPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;

  let tabId: number | undefined;

  function start() {
    function notify(type: "ping" | "pong") {
      sendMessageToExtension(type, {
        name: _instance.name,
        timestamp: Date.now(),
      });
    }

    function getListeners(): InterceptorPayload<unknown>[] {
      return _instance.getListeners().map((listener) => {
        return {
          id: listener.id,
          staticId: listener.staticId,
          type: listener.type,
          name: _instance.name,
          patterns: listener.patterns,
          interactive: listener.interactive,
          owner: listener.owner,
          enabled: listener.enabled,
          timestamp: listener.timestamp,
          sourceCode: listener.data
            ? undefined
            : String(listener.handler).trim(),
          stack: listener.stack,
        };
      });
    }

    function ready() {
      console.log("tweaker extension plugin is ready");
      // notifyExtensionInit(_instance, getListeners());
    }

    function handleInterceptors(
      interceptors: ExtensionDevtoolsMessages.InitMessage["payload"]["interceptors"],
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

        if (_instance.hasListener(listener.id)) {
          _instance.removeListener(listener.id);
        }

        _instance.intercept(
          listener.patterns,
          getHandler(listener.type, listener.data),
          {
            id: listener.id,
            owner: listener.owner,
            interactive: listener.interactive,
            enabled: listener.enabled,
            type: listener.type,
          },
        );
      }
    }

    function handleAddedInterceptors(
      interceptors: ExtensionDevtoolsMessages.AddInterceptorsMessage["payload"]["data"],
    ) {
      for (const listener of interceptors) {
        if (listener.owner !== EXTENSION_OWNER) {
          continue;
        }
        if (_instance.hasListener(listener.id)) {
          continue;
        }

        _instance.intercept(
          listener.patterns,
          getHandler(listener.type, listener.data),
          {
            id: listener.id,
            owner: listener.owner,
            interactive: listener.interactive,
            enabled: listener.enabled,
            type: listener.type,
          },
        );
      }
    }

    function handleUpdatedInterceptors(
      interceptors: ExtensionDevtoolsMessages.UpdateInterceptorsMessage["payload"]["data"],
    ) {
      for (const listener of interceptors) {
        const found = _instance.getListener(listener.id);
        if (!found) {
          continue;
        }

        _instance.updateListener(listener.id, {
          owner: listener.owner,
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          ...(found.owner === EXTENSION_OWNER && {
            handler: getHandler(listener.type, listener.data),
          }),
        });
      }
    }

    function handleRemovedInterceptors(
      interceptors: ExtensionDevtoolsMessages.RemoveInterceptorsMessage["payload"]["data"],
    ) {
      for (const listener of interceptors) {
        _instance.removeListener(listener.id);
      }
    }

    function handleDuplicatedInterceptors(
      interceptors: ExtensionDevtoolsMessages.DuplicateInterceptorsMessage["payload"]["data"],
    ) {
      interceptors.forEach((interceptor) => {
        const listener = _instance.getListener(interceptor.id);
        if (!listener) return;

        const id = generateNumberId();

        _instance.intercept(listener.patterns, listener.handler, {
          id,
          enabled: false,
          interactive: listener.interactive,
          owner: listener.owner,
          type: listener.type,
        });

        const newListener = _instance.getListener(id);

        if (newListener) {
          newListener.stack = listener.stack;
        }
      });
    }

    function handleClearInterceptors() {
      _instance.reset();
    }

    function subscribeForExtensionMessages() {
      if (!("addEventListener" in globalThis)) return;

      globalThis.addEventListener("message", async (event: MessageEvent) => {
        if (!isForPluginMessage(event.data)) return;

        await readyPromise.finally();

        switch (event.data.type) {
          case "interceptors": {
            handleInterceptors(event.data.payload.data);
            break;
          }
          case "interceptors:add": {
            handleAddedInterceptors(event.data.payload.data);
            break;
          }
          case "interceptors:update": {
            handleUpdatedInterceptors(event.data.payload.data);
            break;
          }
          case "interceptors:remove": {
            handleRemovedInterceptors(event.data.payload.data);
            break;
          }
          case "interceptors:duplicate": {
            handleDuplicatedInterceptors(event.data.payload.data);
            break;
          }
          case "clear-interceptors": {
            handleClearInterceptors();
            break;
          }
          case "ping":
          case "pong": {
            notifyExtensionInterceptors(getListeners());
            break;
          }
        }
      });
    }

    function subscribeForInstanceMessages() {
      _instance.subscribe(
        "**",
        async ({
          key,
          type,
          tweaked,
          originalValue,
          result,
          error,
          interceptorId,
          stack,
        }) => {
          const timestamp = Date.now();
          await readyPromise.finally();
          sendMessageToExtension("value", {
            id: generateStringId(),
            name: _instance.name,
            key,
            type,
            originalValue: clone(originalValue),
            result: clone(result),
            timestamp,
            tweaked,
            error: error ?? false,
            interceptorId,
            stack,
          });
        },
        { mode: "all" },
      );

      _instance.on("intercept.new", async (listener) => {
        if (listener.owner !== TWEAKER_OWNER) return;
        await readyPromise.finally();
        notifyExtensionNewIntercept(_instance, listener);
      });

      _instance.on("intercept.remove", async (listener) => {
        if (listener.owner !== TWEAKER_OWNER) return;
        await readyPromise.finally();
        notifyExtensionRemoveIntercept(_instance, listener);
      });
    }

    const readyPromise = new Promise<void>((resolve) => {
      if (!("addEventListener" in globalThis)) return resolve();
      notify("ping");
      const handler = (event: MessageEvent) => {
        if (!isForPluginMessage(event.data)) return;

        if (event.data.type === "ping" || event.data.type === "pong") {
          notifyExtensionInit(_instance, getListeners());
        }

        if (event.data.type === "init") {
          tabId = event.data.tabId;
          handleInterceptors(event.data.payload.interceptors);
          globalThis.removeEventListener("message", handler);
          resolve();
        }
      };
      globalThis.addEventListener("message", handler);
    }).then(() => ready());

    promises.push(readyPromise);

    subscribeForExtensionMessages();
    subscribeForInstanceMessages();
  }

  return {
    name,
    version,
    setup: (instance) => {
      _instance = instance;
      registerInstance(instance);
      start();
    },
    ready: () => {
      return Promise.all(promises).then(() => true);
    },
    getTabId: () => {
      return Promise.all(promises).then(() => tabId);
    },
  };
}
