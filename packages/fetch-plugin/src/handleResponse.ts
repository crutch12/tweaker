export const bodyTypes = [
  "json",
  "text",
  "blob",
  "formData",
  "arrayBuffer",
] as const;

type BodyType = (typeof bodyTypes)[number];

type HandleResponseData<T> = (bodyType: BodyType, data: T) => Promise<T>;

function isBodyType(value: string): value is BodyType {
  if (bodyTypes.includes(value as BodyType)) return true;
  return false;
}

export function handleResponse<T>(
  response: Response,
  handler: HandleResponseData<T>,
) {
  return new Proxy(response, {
    get(target, prop: BodyType) {
      const value = target[prop];

      if (typeof value === "function") {
        // We only care about body-reading methods
        if (isBodyType(prop)) {
          return async function (...methodArgs: any) {
            try {
              let result = await value.apply(target, methodArgs);
              return handler(prop, result);
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
}
