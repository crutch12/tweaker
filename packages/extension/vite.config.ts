import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { version } from "./package.json";
import { reloadOnRebuild } from "vite-plugin-reload-on-rebuild";
import { visualizer } from "rollup-plugin-visualizer";

function generateExtensionManifest(
  manifest: chrome.runtime.ManifestV3,
): Plugin {
  return {
    name: "generate-extension-manifest-plugin",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

export default defineConfig(({}) => {
  const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

  return {
    plugins: [
      react(),
      reloadOnRebuild({
        interval: 1000,
        filter: (path) => Boolean(path.match(/app[\\/]index\.html/)),
      }),
      visualizer({
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        emitFile: true,
        filename: "analyse.html",
      }),
      generateExtensionManifest({
        manifest_version: 3,
        name: "Tweaker DevTools",
        version,
        devtools_page: "src/devtools/index.html",
        permissions: ["tabs", "scripting", "storage"],
        icons: {
          "16": "icons/16-enabled.png",
          "32": "icons/32-enabled.png",
          "48": "icons/48-enabled.png",
          "128": "icons/128-enabled.png",
        },
        action: {
          default_title: "Tweaker DevTools",
          default_icon: {
            "16": "icons/16-disabled.png",
            "32": "icons/32-disabled.png",
            "48": "icons/48-disabled.png",
            "128": "icons/128-disabled.png",
          },
          default_popup: "popups/disabled.html",
        },
        content_scripts: [
          {
            matches: ["http://*/*", "https://*/*"],
            js: ["tweaker-content-script.js"],
          },
        ],
        background: {
          // chrome, safari
          service_worker: "background-sw.js",
          type: "module",
          // @ts-expect-error // firefox
          scripts: ["background-sw.js"],
        },
        browser_specific_settings: {
          gecko: {
            id: "@tweaker-devtools",
          },
        },
      }),
    ],

    define: {
      "import.meta.env.VERSION": `"${version}"`,
    },

    optimizeDeps: {
      esbuildOptions: {
        // force esm usage for misconfigured deps' package.json
        mainFields: ["exports", "module", "main"],
      },
    },

    resolve: {
      // force esm usage for misconfigured deps' "exports" field
      conditions: ["module", "import", "browser", "default"],
    },

    build: {
      minify: !isWatchMode,
      watch: isWatchMode
        ? {
            buildDelay: 1000,
          }
        : undefined,
      rollupOptions: {
        input: [
          "src/app/index.html",
          "src/devtools/index.html",
          "src/background/background-sw.ts",
          "src/content-scripts/index.ts",
        ],
        output: {
          entryFileNames: (chunkInfo) => {
            if (
              chunkInfo.facadeModuleId?.includes("background/background-sw.ts")
            ) {
              return "[name].js";
            }
            if (
              chunkInfo.facadeModuleId?.includes("content-scripts/index.ts")
            ) {
              return "tweaker-content-script.js";
            }
            return "assets/[name]-[hash].js";
          },
        },
      },
    },
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
  };
});
