import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/app.ts"],
  outDir: "dist",
  format: ["cjs"],
  target: "node18",
  clean: true,
  sourcemap: true
});
