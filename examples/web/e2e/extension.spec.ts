import type { tweaker } from "../src/tweaker";
import { test, expect } from "./fixtures/extension";

test.describe("extension", () => {
  test("loaded", async ({ page, browserName }) => {
    await page.goto("/");

    const shouldBeLoaded = browserName !== "webkit";

    await expect(
      page.getByText(`Extension loaded: ${shouldBeLoaded}`),
    ).toBeVisible();
  });

  test("extensionId", async ({ page, browserName, extensionId }) => {
    await page.goto("about:blank");

    const shouldBeDefined = browserName === "chromium";

    if (shouldBeDefined) {
      expect(extensionId).toBeDefined();
      expect(extensionId?.length).toBeGreaterThan(1);
    } else {
      expect(extensionId).not.toBeDefined();
    }
  });

  test("devtools", async ({ page, extensionId, context }) => {
    test.skip(
      typeof extensionId === "undefined",
      "This feature is Chromium-only (so far)",
    );

    const appName = "web";

    await page.goto("/");

    const tabId = await page.evaluate((appName) => {
      return new Promise<number | undefined>((resolve) => {
        window.__TWEAKER_REGISTRY__?.withInstance<typeof tweaker>(
          appName,
          (instance) => {
            instance.getPlugin("extension")?.getTabId().then(resolve);
          },
        );
      });
    }, appName);

    expect(tabId).toBeTruthy();

    if (!tabId) {
      throw new Error(`tabId show exist ${tabId}`);
    }

    const devToolsPage = await context.newPage();

    await devToolsPage.goto(
      `chrome-extension://${extensionId}/src/app/index.html?tabId=${tabId}`,
    );

    await expect(
      devToolsPage.getByText("Interceptors are empty"),
    ).toBeVisible();

    const messages = await devToolsPage
      .locator("[data-row-key]")
      .filter({ hasText: appName });
    const tweakedMessages = await messages.filter({ hasNotText: "empty" });
    const interceptors = await devToolsPage.locator("[data-interceptor-id]");

    expect((await messages.all()).length).toBeGreaterThan(0);
    expect(await tweakedMessages.all()).toHaveLength(0);

    await page.getByText("Start Tweaker").click();

    expect((await interceptors.all()).length).toBeGreaterThan(0);

    await page.getByText("Add User").click();

    const tweakedMessagesLength = (await tweakedMessages.all()).length;
    expect(tweakedMessagesLength).toBeGreaterThan(0);

    await page.getByText("Stop Tweaker").click();

    await expect(
      devToolsPage.getByText("Interceptors are empty"),
    ).toBeVisible();

    await page.getByText("Add User").click();

    expect((await tweakedMessages.all()).length).toBe(tweakedMessagesLength);
  });
});
