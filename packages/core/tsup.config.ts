import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/plugin.ts", "src/utils.ts"],

  format: ["esm"],

  dts: true,

  minify: false,

  sourcemap: true,

  clean: !options.watch,

  // target: 'esnext',
}));
