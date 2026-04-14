Tweaker allows intercept code calls and return results via own values (even with errors).

## @tweaker/core

```ts
// tweaker.ts
import { Tweaker } from "@tweaker/core";

const tweaker = new Tweaker({
  name: "web",
});

export { tweaker };
```

```ts
// example.ts
import { tweaker } from "./tweaker.ts";

function generateUser(): User {
  return tweaker.value<User>(
    "users.generate",
    // provide original value, e.g. taken from api
    {
      id: Math.ceil(Math.random() * 1000),
      name: "Glep 🥸",
      year: 2001,
    },
  );
}

// intercept via programmatic usage
tweaker.intercept("users.generate", (key, value): User => {
  // intercept "users.generate" and provide own value (or throw error)
  return {
    ...value,
    name: value.name + " (tweaked)",
    year: Math.ceil(Math.random() * 2000),
  };
});
```

## Tweaker DevTools

Tweaker DevTools allows you to intercept `tweaker.value` via Browser's DevTools Panel.

1. Add Extension Plugin:

```ts
import { Tweaker } from "@tweaker/core";
import { extensionPlugin } from "@tweaker/extension-plugin";

const plugins = {
  extension: extensionPlugin({ allowExpressions: true }),
};

const tweaker = new Tweaker<{
  plugins: typeof plugins;
}>({
  name: "web",
  plugins,
});

export { tweaker };
```

2. Install Web Extension - Tweaker DevTools

3. Open DevTools - Tweaker

4. See logs and provide any value for intercepted code calls.

![26-04-14_14 16 chrome_FJwXCYh0ps](https://github.com/user-attachments/assets/0b3a4748-98b8-4b6f-8284-f2d270278e58)

