import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import preview from "vite-live-preview";

export default defineConfig(() => {
  const isWatchMode =
    process.argv.includes("--watch") || process.argv.includes("-w");

  return {
    plugins: [react(), preview()],

    server: {
      host: "0.0.0.0",
      port: 3000,
      open: true,
      allowedHosts: true as const,
    },

    preview: {
      host: "0.0.0.0",
      port: 3000,
      open: true,
      allowedHosts: true as const,
    },

    build: {
      minify: !isWatchMode,
      outDir: "dist",
    },
  };
});
