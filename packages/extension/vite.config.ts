import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    rollupOptions: {
      input: ["src/devtools/index.html"],
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
