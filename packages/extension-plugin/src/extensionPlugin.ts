import { TweakerPlugin } from "@tweaker/core/plugin";
import { generateNumberId, generateStringId } from "@tweaker/core/utils";
import { version, name } from "../package.json";
import { ExtensionDevtoolsMessages } from "./messages/types";
import {
  Tweaker,
  TWEAKER_OWNER,
  InterceptorId,
  TweakHandler,
  isDefaultInterceptor,
  isSampleInterceptor,
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
import { clone } from "@tweaker/core/utils";
import { isManualInterceptor } from "./ManualInterceptor";
// import { handleResponse } from "@tweaker/fetch-plugin";

function getHandler(
  data: InterceptorPayload["data"],
): TweakHandler<string, any> {
  return (key, value, ctx) => {
    return new Function("key", "value", "ctx", data?.expression ?? "")(
      key,
      value,
      ctx,
    );
  };
}

interface ExtensionPlugin extends TweakerPlugin {
  getTabId: () => Promise<number | undefined>;
}

export interface ExtensionPluginOptions {}

export function extensionPlugin({}: ExtensionPluginOptions = {}): ExtensionPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;
  let _emitter: Tweaker["eventEmitter"];
  let _pluginHooks: Tweaker["pluginHooks"];

  let tabId: number | undefined;

  function start() {
    function notify(type: "ping" | "pong") {
      sendMessageToExtension(type, {
        name: _instance.name,
        timestamp: Date.now(),
      });
    }

    function getListeners(): InterceptorPayload[] {
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
          sourceCode:
            listener.owner === TWEAKER_OWNER
              ? String(listener.handler).trim()
              : undefined,
          stack: listener.stack,
          data: listener.data,
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

        _pluginHooks.addInterceptor({
          ...listener,
        });
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

        _pluginHooks.addInterceptor({
          ...listener,
        });
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

        _pluginHooks.updateInterceptor({
          ...listener,
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
          data: listener.data,
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
          id,
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
            id,
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

      _emitter.on("value.update", async (id, options) => {
        const timestamp = Date.now();
        await readyPromise.finally();
        sendMessageToExtension("value:update", {
          id,
          timestamp,
          ...options,
        });
      });

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
    setup: (instance, emitter, pluginHooks) => {
      _instance = instance;
      _emitter = emitter;
      _pluginHooks = pluginHooks;
      registerInstance(instance);
      start();
    },
    ready: () => {
      return Promise.all(promises).then(() => true);
    },
    getTabId: () => {
      return Promise.all(promises).then(() => tabId);
    },
    handleAddInterceptor: (listener) => {
      if (isManualInterceptor(listener)) {
        _instance.intercept(listener.patterns, getHandler(listener.data), {
          ...listener,
        });
        return true;
      }

      return false;
    },
    handleUpdateInterceptor: (listener) => {
      const found = _instance.getListener(listener.id);
      if (!found) {
        return false;
      }

      if (isDefaultInterceptor(listener) || isSampleInterceptor(listener)) {
        _instance.updateListener(listener.id, {
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          data: listener.data,
        });
        return true;
      }

      if (isManualInterceptor(listener)) {
        _instance.updateListener(listener.id, {
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          data: listener.data,
          handler: getHandler(listener.data),
        });
        return true;
      }

      return false;
    },
  };
}
