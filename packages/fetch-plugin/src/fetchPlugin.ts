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
import { FetchInterceptor, isFetchInterceptor } from "./FetchInterceptor";
import { FETCH_VALUE_TYPE } from "./const";

type AsyncFunctionConstructor = new (
  ...args: string[]
) => (...args: any[]) => Promise<any>;

const AsyncFunction = async function () {}
  .constructor as AsyncFunctionConstructor;

function getHandler(
  data: FetchInterceptor["data"],
  emitter: Tweaker["eventEmitter"],
): TweakHandler<string, Response> {
  return (key, response, ctx) => {
    if (ctx.type !== FETCH_VALUE_TYPE) return ctx.bypass;

    return handleResponse(response, async (responseType, value) => {
      debugger;
      const mockString = data?.[responseType];
      if (!mockString) return value;

      let result;

      switch (responseType) {
        case "json":
          result = JSON5.parse(mockString);
          break;
        case "text":
          result = mockString;
          break;
        case "expression":
          result = await new AsyncFunction("key", "value", "ctx", mockString)();
          break;
      }

      emitter.emit("value.update", ctx.id, {
        result: {
          ...clone(response),
          body: result,
        },
      });

      return result;
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
                data: value,
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
