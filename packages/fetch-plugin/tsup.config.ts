import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],

  format: ["esm"],

  dts: true,

  minify: false,

  sourcemap: true,

  clean: !options.watch,

  // target: 'esnext',
}));
