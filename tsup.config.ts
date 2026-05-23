import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/app.ts"],
  outDir: "dist",
  format: ["cjs"],
  target: "node18",
  clean: true,
  sourcemap: true,
});
