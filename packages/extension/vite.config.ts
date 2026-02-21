import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { version } from "./package.json";
import { reloadOnRebuild } from "vite-plugin-reload-on-rebuild";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({}) => {
  const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

  return {
    plugins: [
      react(),
      reloadOnRebuild({
        interval: 1000,
      }),
      visualizer({
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        emitFile: true,
        filename: "analyse.html",
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
