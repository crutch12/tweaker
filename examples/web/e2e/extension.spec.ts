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
});
