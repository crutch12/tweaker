import { TweakerPlugin } from "@tweaker/core/plugin";
import { generateStringId } from "@tweaker/core/utils";
import { version, name } from "../package.json";
import {
  ExtensionDevtoolsMessages,
  ExtensionPluginMessages,
} from "./messages/types";
import { klona } from "klona/json";
import { Tweaker, TWEAKER_OWNER, InterceptorId } from "@tweaker/core";
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
  EXTENSION_DEVTOOLS_SOURCE,
} from "./const";
import type { InterceptorPayload } from "./types";
import { sendMessageToExtension } from "./sendMessageToExtension";
import { isForPluginMessage } from "./messages";

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): TweakerPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;

  let expressions = new Map<InterceptorId, string>();

  function subscribe(instance: Tweaker) {
    instance.subscribe(
      "*",
      ({
        key,
        tweaked,
        originalValue,
        result,
        error,
        interceptorId,
        stack,
      }) => {
        sendMessageToExtension("value", {
          id: generateStringId(),
          name: instance.name,
          key,
          originalValue: isErrorLike(originalValue)
            ? serializeError(originalValue)
            : klona(originalValue),
          result: isErrorLike(result) ? serializeError(result) : klona(result),
          timestamp: Date.now(),
          tweaked,
          error: error ?? false,
          interceptorId,
          stack,
        });
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

    const promise = new Promise<void>((resolve) => {
      notify("ping");
      const handler = (event: MessageEvent) => {
        if (!isForPluginMessage(event.data)) return;

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

    globalThis.addEventListener("message", (event: MessageEvent) => {
      if (!isForPluginMessage(event.data)) return;
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
        case "ping":
        case "pong": {
          notifyExtensionInterceptors(getListeners());
          break;
        }
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
    ready: () => {
      return Promise.all(promises).then(() => true);
    },
  };
}
