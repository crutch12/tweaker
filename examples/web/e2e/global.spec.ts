import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

test.describe("registry", () => {
  test("exists", async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(import.meta.resolve("@tweaker/core/iife/global")),
    });

    await page.goto("https://example.com");

    const result = await page.evaluate(
      () => typeof window.__TWEAKER_REGISTRY__ === "object",
    );

    expect(result).toBe(true);
  });
});

test.describe("withInstance", () => {
  test("before page loaded", async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(import.meta.resolve("@tweaker/core/iife/global")),
    });

    const tweakerCreatedPromise = new Promise<string>((resolve) => {
      page.exposeFunction("tweakerCreated", (name: string) => resolve(name));
    });

    await page.addInitScript(() => {
      window.__TWEAKER_REGISTRY__?.withInstance("web", (instance) => {
        // @ts-expect-error
        window.tweakerCreated(instance.name);
      });
    });

    await page.goto("/");

    const result = await tweakerCreatedPromise;

    expect(result).toBe("web");
  });

  test("after page loaded", async ({ page }) => {
    await page.goto("/");

    const result = await page.evaluate<string>(() => {
      return new Promise((resolve) => {
        window.__TWEAKER_REGISTRY__?.withInstance("web", (instance) => {
          resolve(instance.name);
        });
      });
    });

    expect(result).toBe("web");
  });
});
