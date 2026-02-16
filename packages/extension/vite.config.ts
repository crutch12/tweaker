import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { version } from "./package.json";
import { pollReloadPlugin } from "../../vite-plugins/pollReloadPlugin";

export default defineConfig(({}) => {
  const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

  return {
    plugins: [react(), pollReloadPlugin()],

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
      rollupOptions: {
        input: [
          "src/devtools/index.html",
          "src/devtools/background-sw.ts",
          "src/devtools/content-script.ts",
        ],
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "background-sw") {
              return "[name].js";
            }
            if (chunkInfo.name === "content-script") {
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
