import type { TweakerPlugin } from "@tweaker/core/plugin";
import { version, name } from "../package.json";
import type {
  Tweaker,
  TweakerAnyInterceptor,
  TweakHandler,
} from "@tweaker/core";
import { handleResponse } from "./handleResponse";
import {
  clone,
  generateStringId,
  keyMatchesPatterns,
} from "@tweaker/core/utils";
import JSON5 from "json5";

function getHandler(
  data: TweakerAnyInterceptor["data"],
  emitter: Tweaker["eventEmitter"],
): TweakHandler<string, Response> {
  return (key, response, ctx) => {
    if (ctx.type !== "fetch") return ctx.bypass;

    return handleResponse(response, async (bodyType, value) => {
      let mock = data?.[bodyType]?.static;
      if (!mock) return value;

      if (bodyType === "json") {
        mock = JSON5.parse(mock);
      }

      emitter.emit("value.update", ctx.id, {
        result: {
          ...clone(response),
          [bodyType]: mock,
        },
      });

      return mock;
    });
  };
}

function getRequestUrl(request: RequestInfo | URL) {
  if (request instanceof URL) {
    return request;
  }
  if (typeof request === "string") {
    return new URL(request, globalThis["location"]?.href);
  }
  return new URL(request.url);
}

function formatUrl(url: URL) {
  return `${url.host}${url.pathname}${url.search}`;
}

interface FetchPlugin extends TweakerPlugin {}

export interface FetchPluginOptions {
  /**
   * Intercept only spicified globs
   * @example ['localhost:3000/**']
   */
  filter?: string[];
}

export function fetchPlugin({
  filter = ["*/**"],
}: FetchPluginOptions = {}): FetchPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;
  let _emitter: Tweaker["eventEmitter"];

  function replaceGlobalFetch(tweaker: Tweaker) {
    const originalFetch = globalThis["fetch"];

    if (!originalFetch) return () => {};

    globalThis["fetch"] = (...args: Parameters<typeof originalFetch>) => {
      const [requestUrl, options] = args;
      const formattedUrl = formatUrl(getRequestUrl(requestUrl));
      const method = (options?.method ?? "GET").toUpperCase();
      const key = `${method} ${formattedUrl}`;

      if (filter.length > 0) {
        const matchesFilter = keyMatchesPatterns(formattedUrl, filter);
        if (!matchesFilter) {
          return originalFetch(requestUrl, options);
        }
      }

      return originalFetch(requestUrl, options).then((response) => {
        const id = `fetch:${generateStringId()}`;

        const tweakedResponse = tweaker.value(
          key,
          handleResponse(response, async (bodyType, value) => {
            _emitter.emit("value.update", id, {
              originalValue: {
                ...clone(response),
                [bodyType]: value,
              },
            });
            return value;
          }),
          {
            id,
            type: "fetch",
          },
        );

        return tweakedResponse;
      });
    };

    return () => {
      globalThis["fetch"] = originalFetch;
    };
  }

  return {
    name,
    version,
    setup: (instance, emitter) => {
      _instance = instance;
      _emitter = emitter;
      replaceGlobalFetch(instance);
    },
    ready: () => {
      return Promise.all(promises).then(() => true);
    },
    handleAddInterceptor: (listener) => {
      if (listener.type !== "fetch") return false;
      _instance.intercept(
        listener.patterns,
        getHandler(listener.data, _emitter),
        {
          id: listener.id,
          owner: listener.owner,
          interactive: listener.interactive,
          enabled: listener.enabled,
          type: listener.type,
          data: listener.data,
        },
      );

      return true;
    },
    handleUpdateInterceptor: (listener) => {
      if (listener.type !== "fetch") return false;
      const found = _instance.getListener(listener.id);
      if (!found) {
        return false;
      }

      if (listener.type === "fetch") {
        _instance.updateListener(listener.id, {
          // owner: listener.owner,
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          handler: getHandler(listener.data, _emitter),
          // ...(found.owner === EXTENSION_OWNER && {
          // }),
        });
        return true;
      }
      return false;
    },
  };
}
