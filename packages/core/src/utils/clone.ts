import { klona } from "klona/json";
import { isErrorLike, serializeError } from "serialize-error";

function safeClone<T>(val: T, seen = new WeakMap()): any {
  // 1. Handle Primitives & Null
  if (val === null || typeof val !== "object") {
    if (typeof val === "function")
      return `[Function: ${val.name || "anonymous"}]`;
    if (typeof val === "symbol") return val.toString();
    return val;
  }

  // 2. Handle Circular References
  if (seen.has(val)) return seen.get(val);

  // 3. Handle Special Web API Objects (The "Interceptors")
  if (val instanceof Headers) return Object.fromEntries(val.entries());
  if (val instanceof Request) {
    return {
      url: val.url,
      method: val.method,
      mode: val.mode,
      credentials: val.credentials,
      cache: val.cache,
      referrer: val.referrer,
      headers: safeClone(val.headers),
    };
  }
  if (val instanceof Response) {
    return {
      url: val.url,
      status: val.status,
      statusText: val.statusText,
      ok: val.ok,
      redirected: val.redirected,
      type: val.type,
      headers: safeClone(val.headers),
    };
  }
  if (val instanceof Date) return new Date(val.getTime());
  if (val instanceof RegExp) return new RegExp(val.source, val.flags);

  // 4. Initialize the Clone (Array vs Object)
  const clone: Record<number | string, any> = Array.isArray(val) ? [] : {};
  seen.set(val, clone); // Track to prevent infinite loops

  // 5. Recursive Step
  if (Array.isArray(val)) {
    val.forEach((item, index) => {
      clone[index] = safeClone(item, seen);
    });
  } else {
    // Use Object.keys to avoid inherited properties
    Object.keys(val).forEach((key) => {
      clone[key] = safeClone(val[key as keyof object], seen);
    });
  }

  return clone;
}

export function clone<T>(value: T) {
  const result = isErrorLike(value) ? serializeError(value) : klona(value);
  return safeClone(result);
}
