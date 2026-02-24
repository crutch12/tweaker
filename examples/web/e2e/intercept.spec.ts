import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import type { tweaker } from "../src/tweaker";

test.describe("intercept", () => {
  test("before page loaded", async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(import.meta.resolve("@tweaker/core/iife/global")),
    });

    await page.addInitScript(() => {
      window.__TWEAKER_REGISTRY__?.withInstance<typeof tweaker>(
        "web",
        (instance) => {
          instance.intercept("users.generate", (key, value) => ({
            ...value,
            name: "tweaker - intercepted - before",
          }));
        },
      );
    });

    await page.goto("/");

    await expect(
      page.getByText("tweaker - intercepted - before"),
    ).toBeVisible();
  });

  test("after page loaded", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Add User").waitFor();

    await page.evaluate(() => {
      window.__TWEAKER_REGISTRY__?.withInstance<typeof tweaker>(
        "web",
        (instance) => {
          instance.intercept("users.generate", (key, value) => ({
            ...value,
            name: "tweaker - intercepted - after",
          }));
        },
      );
    });

    await page.getByText("Add User").click();

    await expect(page.getByText("tweaker - intercepted - after")).toBeVisible();
  });
});
