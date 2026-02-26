import {
  test as base,
  chromium,
  type BrowserContext,
  firefox,
} from "@playwright/test";
import { fileURLToPath } from "url";
import fs from "node:fs/promises";
import { withExtension } from "playwright-webextext";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string | undefined;
}>({
  context: async ({ browserName, context }, use) => {
    const pathToExtension = fileURLToPath(
      import.meta.resolve("../../../../packages/extension/dist"),
    );

    if (browserName !== "webkit") {
      await fs.access(pathToExtension).catch((err) => {
        console.error(
          `Cannot test extension: couldn't find build: ${pathToExtension}`,
        );
        console.error(`Run "pnpm build" to build extension.`);
        console.error(err);
        throw err;
      });
    }

    switch (browserName) {
      case "chromium": {
        const context = await chromium.launchPersistentContext("", {
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
        const browserTypeWithExtension = withExtension(
          firefox, // base browser type
          pathToExtension, // local directory containing manifest.json
        );
        const browser = await browserTypeWithExtension.launch({});
        const context = await browser.newContext();
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
  extensionId: async ({ browserName, context }, use) => {
    switch (browserName) {
      case "chromium":
        let [serviceWorker] = context.serviceWorkers();
        if (!serviceWorker)
          serviceWorker = await context.waitForEvent("serviceworker");
        const extensionId = serviceWorker.url().split("/")[2];
        await use(extensionId);
        break;
      default:
        await use(undefined);
    }
  },
});

export const expect = test.expect;
