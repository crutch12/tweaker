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
  extensionUrl: string | undefined;
}>({
  context: async ({ browserName, context }, use, testInfo) => {
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
        const extensionId = crypto.randomUUID();
        const browserTypeWithExtension = withExtension(
          firefox, // base browser type
          pathToExtension, // local directory containing manifest.json
        );
        const browser = await browserTypeWithExtension.launch({
          firefoxUserPrefs: {
            "extensions.webextensions.uuids": JSON.stringify({
              "@tweaker-devtools": extensionId,
            }),
          },
        });
        const context = await browser.newContext();
        testInfo.annotations.push({
          type: "extensionId",
          description: extensionId,
        });
        await use(context);
        await context.close();
        break;
      }
      default: {
        console.warn(`${browserName} can't install extensions`);
        await use(context);
        await context.close();
      }
    }
  },
  extensionId: async ({ browserName, context }, use, testInfo) => {
    switch (browserName) {
      case "chromium": {
        let [serviceWorker] = context.serviceWorkers();
        if (!serviceWorker)
          serviceWorker = await context.waitForEvent("serviceworker");
        const extensionId = serviceWorker.url().split("/")[2];
        await use(extensionId);
        break;
      }
      case "firefox": {
        const annotation = testInfo.annotations.find(
          (an) => an.type === "extensionId",
        );
        const extensionId = annotation ? annotation.description! : undefined;
        await use(extensionId);
        break;
      }
      default:
        console.warn(`${browserName} can't retrieve extension id`);
        await use(undefined);
    }
  },
  extensionUrl: async ({ browserName, extensionId }, use) => {
    switch (browserName) {
      case "chromium": {
        const extensionUrl = `chrome-extension://${extensionId}`;
        await use(extensionUrl);
        break;
      }
      case "firefox": {
        const extensionUrl = `moz-extension://${extensionId}`;
        await use(extensionUrl);
        break;
      }
      default:
        console.warn(`${browserName} can't retrieve extension url`);
        await use(undefined);
    }
  },
});

export const expect = test.expect;
