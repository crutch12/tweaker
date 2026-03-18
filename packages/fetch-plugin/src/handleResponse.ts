import { FetchResponseType } from "./FetchInterceptor";

type HandleResponseData<T> = (
  bodyType: FetchResponseType,
  data: T,
) => Promise<T>;

export function handleResponse<T>(
  response: Response,
  handler: HandleResponseData<T>,
) {
  return new Proxy(response, {
    get(target, prop) {
      if (prop === "json") {
        // FIXME: why??
        const value = target[prop];

        // We only care about body-reading methods
        return async function (...methodArgs: Parameters<typeof value>) {
          try {
            const result = await value.apply(target, methodArgs);
            return handler(prop, result);
          } catch (err) {
            console.error(`Fetch error in .${prop}():`, err);
            throw err; // Re-throw so the app can handle the error
          }
        };
      }

      const value = target[prop as keyof typeof target];
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
  });
}
