import type { TweakerPlugin } from "@tweaker/core/plugin";
import { version, name } from "../package.json";
import type { Tweaker } from "@tweaker/core";
import { handleResponse } from "./handleResponse";
import { clone, generateStringId } from "@tweaker/core/utils";

function getRequestUrl(request: RequestInfo | URL) {
  if (request instanceof URL) {
    return request;
  }
  if (typeof request === "string") {
    return new URL(request, globalThis["location"]?.href);
  }
  return new URL(request.url);
}

interface FetchPlugin extends TweakerPlugin {}

export interface FetchPluginOptions {}

export function fetchPlugin({}: FetchPluginOptions = {}): FetchPlugin {
  const promises: Promise<void>[] = [];

  let _instance: Tweaker;
  let _emitter: Tweaker["eventEmitter"];

  function replaceGlobalFetch(tweaker: Tweaker) {
    const originalFetch = globalThis["fetch"];

    if (!originalFetch) return;

    globalThis["fetch"] = (...args: Parameters<typeof originalFetch>) => {
      const [requestUrl, options] = args;
      return originalFetch(requestUrl, options).then((response) => {
        const method = (options?.method ?? "GET").toUpperCase();
        const url = getRequestUrl(requestUrl);
        const host = globalThis["location"]?.host === url.host ? "" : url.host;
        const key = `${method} ${host}${url.pathname}${url.search}`;

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
  };
}
