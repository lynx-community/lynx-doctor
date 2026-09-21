import { readFileSync } from "node:fs";
import { defineConfig } from "@rslib/core";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  lib: [
    {
      format: "esm",
      syntax: "es2022",
      dts: true
    }
  ],
  source: {
    define: { __LYNX_DOCTOR_VERSION__: JSON.stringify(packageJson.version) },
    entry: {
      index: "./src/index.ts",
      cli: "./src/cli/index.ts"
    }
  },
  output: {
    target: "node",
    cleanDistPath: true
  },
  tools: {
    htmlPlugin: false
  }
});
