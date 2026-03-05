import type { TweakerPlugin } from "@tweaker/core/plugin";
import { version, name } from "../package.json";
import type { Tweaker } from "@tweaker/core";

function getRequestUrl(request: RequestInfo | URL) {
  if (request instanceof URL) {
    return request;
  }
  if (typeof request === "string") {
    return new URL(request, location.href);
  }
  return new URL(request.url);
}

interface FetchPlugin extends TweakerPlugin {}

export interface FetchPluginOptions {}

export function fetchPlugin({}: FetchPluginOptions = {}): FetchPlugin {
  const promises: Promise<void>[] = [];

  function replaceGlobalFetch(tweaker: Tweaker) {
    const originalFetch = globalThis["fetch"];

    globalThis["fetch"] = (...args: Parameters<typeof originalFetch>) => {
      const [requestUrl, options] = args;
      return originalFetch(requestUrl, options).then((response) => {
        const method = (options?.method ?? "GET").toUpperCase();
        const url = getRequestUrl(requestUrl);
        const key = `${method} ${location.host === url.host ? "" : url.host}${url.pathname}${url.search}`;

        const tweakedResponse = tweaker.value(key, response, {
          type: "fetch",
          // params: {
          //   text: async (data: string) => {
          //     return "huy sosi, loh";
          //   },
          // },
        });

        // tweaker.intercept(key, (key, response: Response, ctx) => {
        //   if (ctx.type !== "fetch") return ctx.bypass;
        //   return new Proxy(response, {
        //     get(target, prop: keyof typeof response) {
        //       const value = target[prop];

        //       if (typeof value === "function") {
        //         // We only care about body-reading methods
        //         const bodyMethods = [
        //           "json",
        //           "text",
        //           "blob",
        //           "formData",
        //           "arrayBuffer",
        //         ];

        //         if (bodyMethods.includes(prop)) {
        //           return async function (...methodArgs: any) {
        //             try {
        //               // @ts-expect-error
        //               const data = await value.apply(target, methodArgs);
        //               const mock = ctx.params[prop];
        //               if (mock && typeof mock === "function") {
        //                 const result = await mock(data);
        //                 return result;
        //               }
        //               return data;
        //             } catch (err) {
        //               console.error(`Fetch error in .${prop}():`, err);
        //               throw err; // Re-throw so the app can handle the error
        //             }
        //           };
        //         }
        //         // Bind other methods (like .clone()) to the original response
        //         return value.bind(target);
        //       }

        //       return value;
        //     },
        //   });
        // });

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
    setup: (instance) => {
      replaceGlobalFetch(instance);
    },
    ready: () => {
      return Promise.all(promises).then(() => true);
    },
  };
}
