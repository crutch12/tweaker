import { expressionsAllowed, type TweakerPlugin } from "@tweaker/core/plugin";
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
import { isFetchInterceptor } from "./FetchInterceptor";
import { FETCH_VALUE_TYPE } from "./const";

function getHandler(
  data: TweakerAnyInterceptor["data"],
  emitter: Tweaker["eventEmitter"],
): TweakHandler<string, Response> {
  return (key, response, ctx) => {
    if (ctx.type !== FETCH_VALUE_TYPE) return ctx.bypass;

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
  /**
   * Allows plugin to execute (new Function) manual js expressions received from extension.
   * Always false, if CSP doesn't allow run "new Function"
   * @default false
   */
  allowExpressions?: boolean;
}

export function fetchPlugin({
  filter = ["*/**"],
  allowExpressions = false,
}: FetchPluginOptions = {}): FetchPlugin {
  const promises: Promise<void>[] = [];

  if (allowExpressions) {
    allowExpressions = expressionsAllowed();
    if (!allowExpressions) {
      console.warn(
        `[${name}] CSP doesn't allow run "new Function" on this page, allowExpressions is set to "false"`,
      );
    }
  }

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
            type: FETCH_VALUE_TYPE,
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
      if (isFetchInterceptor(listener)) {
        _instance.intercept(
          listener.patterns,
          getHandler(listener.data, _emitter),
          {
            ...listener,
          },
        );
        return true;
      }
      return false;
    },
    handleUpdateInterceptor: (listener) => {
      const found = _instance.getListener(listener.id);
      if (!found) {
        return false;
      }

      if (isFetchInterceptor(listener)) {
        _instance.updateListener(listener.id, {
          interactive: listener.interactive,
          enabled: listener.enabled,
          patterns: listener.patterns,
          data: listener.data,
          handler: getHandler(listener.data, _emitter),
        });
        return true;
      }

      return false;
    },
  };
}
