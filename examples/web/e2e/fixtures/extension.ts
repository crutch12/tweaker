import { test as base, chromium, type BrowserContext } from "@playwright/test";
import { fileURLToPath } from "url";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ browserName, context }, use, testInfo) => {
    const pathToExtension = fileURLToPath(
      import.meta.resolve("../../../../packages/extension/dist"),
    );

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
        // TODO: firefox
        // https://github.com/microsoft/playwright/pull/35926/files#diff-bf947a692b765fa0919a54b1c9deaf2e288feaf4c9516632e22c84183460c26fR59
        // const policiesPath = testInfo.outputPath('policies.json');
        // await fs.promises.writeFile(policiesPath, JSON.stringify(policies));
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
