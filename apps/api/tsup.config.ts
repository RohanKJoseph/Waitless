import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  // Everything in node_modules stays external (Express has dynamic requires);
  // workspace TypeScript packages are bundled so `node dist/server.js` runs
  // without a build step for @waitless/shared.
  skipNodeModulesBundle: true,
  noExternal: ["@waitless/shared"],
});
