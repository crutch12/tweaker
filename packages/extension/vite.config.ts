import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { version } from "./package.json";
import { pollReloadPlugin } from "../../vite-plugins/pollReloadPlugin";

export default defineConfig({
  plugins: [react(), pollReloadPlugin()],

  define: {
    "import.meta.env.VERSION": `"${version}"`,
  },

  build: {
    minify: false,
    rollupOptions: {
      input: [
        "src/devtools/index.html",
        "src/devtools/background-sw.ts",
        "src/devtools/content-script.ts",
      ],
      output: {
        // manualChunks(id) {
        //   if (id.includes("background-sw")) {
        //     return "background-sw";
        //   }
        //   if (id.includes("content-script")) {
        //     return "tweaker-devtools-content-script";
        //   }
        // },
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
});
