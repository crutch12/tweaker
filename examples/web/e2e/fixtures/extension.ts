import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { fileURLToPath } from "url";
import { createTempDir } from "../utils/createTempDir";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ browserName, context }, use) => {
    const userDataDir = await createTempDir(
      "playwright-tweaker-extension-user-data",
    );

    const pathToExtension = fileURLToPath(
      import.meta.resolve("../../../../packages/extension/dist"),
    );

    switch (browserName) {
      case "chromium": {
        const context = await chromium.launchPersistentContext(userDataDir, {
          channel: "chromium",
          args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
          ],
        });
        await use(context);
        await context.close();
        break;
      }
      case "firefox": {
        console.warn(
          `${browserName} can't install extensions (TODO: https://github.com/microsoft/playwright/issues/7297)`,
        );
        await use(context);
        await context.close();
        break;
      }
      default: {
        console.warn(`${browserName} can't install extensions`);
        await use(context);
        await context.close();
        break;
      }
    }
  },
  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker)
      serviceWorker = await context.waitForEvent("serviceworker");

    const extensionId = serviceWorker.url().split("/")[2];

    await use(extensionId);
  },
});

export const expect = test.expect;
