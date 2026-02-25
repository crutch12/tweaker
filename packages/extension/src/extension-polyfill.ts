export {};

declare global {
  var browser: typeof chrome;
}

if (!globalThis["chrome"]) {
  globalThis["chrome"] = globalThis["browser"];
}
