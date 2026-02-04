import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],

  // Форматы временный стандарт
  format: ["esm"],

  dts: true,

  minify: false,

  sourcemap: true,

  clean: true,

  // target: 'esnext',
});
