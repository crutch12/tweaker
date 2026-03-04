import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const config: typeof options = {
    entry: [
      "src/index.ts",
      "src/plugin.ts",
      "src/utils/index.ts",
      "src/global.ts",
    ],
    dts: true,
    minify: false,
    sourcemap: true,
    clean: !options.watch,
  };
  return [
    {
      ...config,
      format: ["esm"],
      outDir: "dist/esm",
    },
    {
      ...config,
      format: ["iife"],
      outDir: "dist/iife",
      outExtension: () => {
        return {
          js: ".js",
        };
      },
    },
  ];
});
