import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

test.describe("intercept", () => {
  test("before page loaded", async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(import.meta.resolve("@tweaker/core/iife/global")),
    });

    await page.addInitScript(() => {
      window.__TWEAKER_REGISTRY__?.withInstance("web", (instance) => {
        instance.intercept("*", () => ({
          intercepted: "before",
        }));
      });
    });

    await page.goto("/");

    await expect(page.getByText(`"intercepted": "before"`)).toBeVisible();
  });

  test("after page loaded", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Add User").waitFor();

    await page.evaluate(() => {
      window.__TWEAKER_REGISTRY__?.withInstance("web", (instance) => {
        instance.intercept("*", () => ({
          intercepted: "after",
        }));
      });
    });

    await page.getByText("Add User").click();

    await expect(page.getByText(`"intercepted": "after"`)).toBeVisible();
  });
});
