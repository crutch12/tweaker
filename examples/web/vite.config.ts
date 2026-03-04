import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import preview from "vite-live-preview";

export default defineConfig(() => {
  const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

  return {
    plugins: [react(), preview()],

    server: {
      port: 3000,
      open: true,
      allowedHosts: true,
    },

    preview: {
      port: 3000,
      open: true,
      allowedHosts: true,
    },

    build: {
      minify: !isWatchMode,
      outDir: "dist",
    },
  };
});
