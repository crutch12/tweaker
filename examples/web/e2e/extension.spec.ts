import { test, expect } from "./fixtures/extension";

test.describe("extension", () => {
  test("loaded", async ({ page, browserName }) => {
    await page.goto("/");

    const shouldBeLoaded = browserName === "chromium";

    await expect(
      page.getByText(`Extension loaded: ${shouldBeLoaded}`),
    ).toBeVisible();
  });
});
