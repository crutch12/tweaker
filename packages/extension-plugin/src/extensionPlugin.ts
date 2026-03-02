import { TweakerPlugin } from "@tweaker/core/plugin";
import { generateStringId } from "@tweaker/core/utils";
import { version, name } from "../package.json";
import { ExtensionDevtoolsMessages } from "./messages/types";
import { klona } from "klona/json";
import { Tweaker, TWEAKER_OWNER, InterceptorId } from "@tweaker/core";
import { serializeError, isErrorLike } from "serialize-error";
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

interface ExtensionPlugin extends TweakerPlugin {
  getTabId: () => Promise<number | undefined>;
}

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): ExtensionPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;

  let expressions = new Map<InterceptorId, string>();

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

    function handleUpdatedInterceptors(
      interceptors: ExtensionDevtoolsMessages.UpdateInterceptorsMessage["payload"]["data"],
    ) {
      for (const listener of interceptors) {
        const found = _instance.getListener(listener.id);
        if (!found) {
          continue;
        }

        if (expressions.has(listener.id)) {
          expressions.set(listener.id, listener.expression ?? "");
        }

        _instance.updateListener(listener.id, {
          owner: listener.owner,
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          ...(found.owner === EXTENSION_OWNER && {
            handler: (key, value) => {
              return new Function("key", "value", listener.expression ?? "")(
                key,
                value,
              );
            },
          }),
        });
      }
    }

    function handleRemovedInterceptors(
      interceptors: ExtensionDevtoolsMessages.RemoveInterceptorsMessage["payload"]["data"],
    ) {
      for (const listener of interceptors) {
        _instance.removeListener(listener.id);
        expressions.delete(listener.id);
      }
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
        "*",
        async ({
          key,
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
            originalValue: isErrorLike(originalValue)
              ? serializeError(originalValue)
              : klona(originalValue),
            result: isErrorLike(result)
              ? serializeError(result)
              : klona(result),
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
