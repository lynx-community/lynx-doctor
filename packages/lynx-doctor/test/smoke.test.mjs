import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAgentPrompt, launchAgent, RULES, scanProject } from "../dist/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const cliPath = path.join(repoRoot, "packages", "lynx-doctor", "bin", "lynx-doctor.js");

const runCli = (args) =>
  execFileSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1"
    }
  });

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const formatRuleSummary = (rules) => {
  const errorCount = rules.filter((rule) => rule.defaultSeverity === "error").length;
  const warningCount = rules.filter((rule) => rule.defaultSeverity === "warning").length;
  return [
    pluralize(rules.length, "rule"),
    [errorCount > 0 ? pluralize(errorCount, "error") : "", warningCount > 0 ? pluralize(warningCount, "warning") : ""]
      .filter(Boolean)
      .join(", ")
  ].join(": ");
};

const writeFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const writeNodeCommand = (directory, name, source) => {
  const scriptPath = path.join(directory, `${name}.cjs`);
  writeFile(scriptPath, source);

  if (process.platform === "win32") {
    const commandPath = path.join(directory, `${name}.cmd`);
    writeFile(commandPath, `@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`);
    return commandPath;
  }

  const commandPath = path.join(directory, name);
  writeFile(commandPath, `#!/bin/sh\nexec "${process.execPath}" "${scriptPath}" "$@"\n`);
  fs.chmodSync(commandPath, 0o755);
  return commandPath;
};

test("rules list prints a readable terminal summary and keeps JSON output", () => {
  const output = runCli(["rules", "list"]);
  const categoryCount = new Set(RULES.map((rule) => rule.category)).size;
  const errorCount = RULES.filter((rule) => rule.defaultSeverity === "error").length;
  const warningCount = RULES.filter((rule) => rule.defaultSeverity === "warning").length;

  assert.match(output, /^Lynx Doctor rules/m);
  assert.match(
    output,
    new RegExp(`${RULES.length} rules across ${categoryCount} categories: ${errorCount} errors, ${warningCount} warnings`),
  );
  assert.match(output, new RegExp(`reactlynx \\(${formatRuleSummary(RULES.filter((rule) => rule.category === "reactlynx"))}\\)`));
  assert.match(output, /ERROR\s+reactlynx\/background-only-api/);
  assert.match(output, /Use "lynx-doctor rules explain <rule-id>" for details\./);

  const jsonRules = JSON.parse(runCli(["rules", "list", "--json"]));
  assert.equal(jsonRules.length, RULES.length);
  assert.equal(jsonRules[0].id, RULES[0].id);

  const jsonRule = JSON.parse(runCli(["rules", "explain", RULES[0].id, "--json"]));
  assert.equal(jsonRule.id, RULES[0].id);
});

test("launchAgent uses non-interactive codex handoff and reports failed agents", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lynx-doctor-agent-"));
  const binDirectory = path.join(root, "bin");
  const codexLogPath = path.join(root, "codex-log.json");
  fs.mkdirSync(binDirectory);
  writeNodeCommand(
    binDirectory,
    "codex",
    `
const fs = require("node:fs");
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  fs.writeFileSync(
    process.env.LYNX_DOCTOR_AGENT_LOG,
    JSON.stringify({
      argv: process.argv.slice(2),
      stdin: input,
      isTTY: Boolean(process.stdin.isTTY)
    }),
  );
});
`,
  );

  const originalPath = process.env.PATH;
  const originalLogPath = process.env.LYNX_DOCTOR_AGENT_LOG;
  process.env.PATH = `${binDirectory}${path.delimiter}${originalPath ?? ""}`;
  process.env.LYNX_DOCTOR_AGENT_LOG = codexLogPath;
  try {
    await launchAgent("codex", "Fix the Lynx warnings.", root);
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    if (originalLogPath === undefined) delete process.env.LYNX_DOCTOR_AGENT_LOG;
    else process.env.LYNX_DOCTOR_AGENT_LOG = originalLogPath;
  }

  const codexLog = JSON.parse(fs.readFileSync(codexLogPath, "utf8"));
  assert.deepEqual(codexLog.argv, ["exec", "-"]);
  assert.equal(codexLog.stdin, "Fix the Lynx warnings.");
  assert.equal(codexLog.isTTY, false);

  const failingAgentPath = writeNodeCommand(root, "failing-agent", "process.exit(7);\n");
  await assert.rejects(() => launchAgent(failingAgentPath, "prompt", root), /exited with code 7/);
});

test("plain CLI skips interactive agent selection when stdout is not a TTY", () => {
  const output = runCli(["examples/event-mode-settings", "--blocking", "none"]);

  assert.match(output, /90\/100 healthy/);
  assert.match(output, /Use --agent-prompt to hand the top findings to a coding agent\./);
  assert.doesNotMatch(output, /Hand off these findings\?/);
});

test("scanProject reports core Lynx diagnostics and builds an agent prompt", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lynx-doctor-"));
  writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "fixture",
      dependencies: {
        "@lynx-js/react": "3.0.0"
      }
    }),
  );
  writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        jsx: "react-jsx"
      }
    }),
  );
  writeFile(
    path.join(root, "src", "App.tsx"),
    `import { useLayoutEffect } from "@lynx-js/react";

export function App() {
  const analytics = lynx.getJSModule("Analytics");
  useLayoutEffect(() => {
    analytics.track("mounted");
  }, []);
  function onTap() {
    console.log("tap");
  }
  return <view main-thread:bindtap={onTap} />;
}
`,
  );

  const report = await scanProject({ directory: root, blocking: "none" });
  const ruleIds = new Set(report.diagnostics.map((diagnostic) => diagnostic.ruleId));

  assert.equal(report.project.framework, "ReactLynx");
  assert.ok(ruleIds.has("reactlynx/background-only-api"));
  assert.ok(ruleIds.has("reactlynx/avoid-use-layout-effect"));
  assert.ok(ruleIds.has("reactlynx/main-thread-handler-directive"));
  assert.ok(ruleIds.has("reactlynx/typescript-jsx-import-source"));
  assert.ok(ruleIds.has("reactlynx/types-package-missing"));
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.category === "reactlynx"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.subcategory === "threading"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.subcategory === "lifecycle"));
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.source?.kind === "skill"));
  assert.match(buildAgentPrompt(report), /Fix the top/);
});

test("scanProject reports lynx-ui rules from skill sources", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lynx-doctor-lynx-ui-"));
  writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "lynx-ui-fixture",
      dependencies: {
        "@lynx-js/react": "3.0.0",
        "@lynx-js/types": "3.0.0",
        "@lynx-js/lynx-ui": "0.1.0",
        "@lynx-js/lynx-ui-button": "0.1.0"
      }
    }),
  );
  writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        jsx: "react-jsx",
        jsxImportSource: "@lynx-js/react",
        isolatedModules: true
      }
    }),
  );
  writeFile(
    path.join(root, "lynx.config.ts"),
    `import { pluginReactLynx } from "@lynx-js/react-rsbuild-plugin";

export default {
  plugins: [pluginReactLynx()]
};
`,
  );
  writeFile(
    path.join(root, "src", "App.tsx"),
    `import { Button, Draggable } from "@lynx-js/lynx-ui";
import { Button as PackageButton } from "@lynx-js/lynx-ui-button";

export function App() {
  return (
    <view>
      <Button bindtap={() => console.log("tap")}>Save</Button>
      <PackageButton onClick={() => console.log("ok")}>OK</PackageButton>
      <Draggable />
    </view>
  );
}
`,
  );

  const report = await scanProject({ directory: root, categories: ["lynx-ui"], blocking: "none" });
  const ruleIds = new Set(report.diagnostics.map((diagnostic) => diagnostic.ruleId));

  assert.equal(report.project.hasLynxUi, true);
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.category === "lynx-ui"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.subcategory === "imports"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.subcategory === "component-api"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.subcategory === "gestures"));
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.source?.skill === "lynx-ui"));
  assert.ok(ruleIds.has("lynx-ui/prefer-public-aggregate-import"));
  assert.ok(ruleIds.has("lynx-ui/button-uses-on-click"));
  assert.ok(ruleIds.has("lynx-ui/gesture-components-enable-new-gesture"));
});

test("scanProject reports rspeedy bundle-size rules from skill sources", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lynx-doctor-rspeedy-"));
  writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "rspeedy-fixture",
      dependencies: {
        "@lynx-js/rspeedy": "0.14.5"
      }
    }),
  );
  writeFile(
    path.join(root, "src", "index.ts"),
    `export * from "./feature.js";

export function runDynamic(code: string) {
  return eval(code);
}
`,
  );
  writeFile(path.join(root, "src", "feature.ts"), "export const value = 1;\n");

  const report = await scanProject({ directory: root, categories: ["rspeedy"], blocking: "none" });
  const ruleIds = new Set(report.diagnostics.map((diagnostic) => diagnostic.ruleId));

  assert.equal(report.project.hasRspeedy, true);
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.category === "rspeedy"));
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.subcategory === "bundle-size"));
  assert.ok(report.diagnostics.every((diagnostic) => diagnostic.source?.skill === "rspeedy-bundle-size"));
  assert.ok(ruleIds.has("rspeedy/no-export-star-barrels"));
  assert.ok(ruleIds.has("rspeedy/no-eval-in-bundle-code"));
});

test("repository examples are real Lynx projects with expected findings", async () => {
  const healthy = await scanProject({
    directory: path.join(repoRoot, "examples", "healthy-shop"),
    blocking: "none"
  });

  assert.equal(healthy.project.framework, "ReactLynx");
  assert.equal(healthy.project.hasRspeedy, true);
  assert.equal(healthy.project.hasLynxTypes, true);
  assert.equal(healthy.score, 100);
  assert.equal(healthy.diagnostics.length, 0);

  const threading = await scanProject({
    directory: path.join(repoRoot, "examples", "threading-regressions"),
    blocking: "none"
  });
  const threadingRules = new Set(threading.diagnostics.map((diagnostic) => diagnostic.ruleId));

  assert.equal(threading.project.framework, "ReactLynx");
  assert.equal(threading.project.hasRspeedy, true);
  assert.deepEqual(threading.summary, {
    errorCount: 3,
    warningCount: 0,
    fileCount: 1,
    ruleCount: 3
  });
  assert.ok(threadingRules.has("reactlynx/background-only-api"));
  assert.ok(threadingRules.has("reactlynx/avoid-use-layout-effect"));
  assert.ok(threadingRules.has("reactlynx/main-thread-handler-directive"));

  const eventMode = await scanProject({
    directory: path.join(repoRoot, "examples", "event-mode-settings"),
    blocking: "none"
  });
  const eventModeRules = new Set(eventMode.diagnostics.map((diagnostic) => diagnostic.ruleId));

  assert.equal(eventMode.project.framework, "ReactLynx");
  assert.equal(eventMode.project.hasRspeedy, true);
  assert.deepEqual(eventMode.summary, {
    errorCount: 0,
    warningCount: 2,
    fileCount: 1,
    ruleCount: 2
  });
  assert.ok(eventModeRules.has("reactlynx/global-props-event-mode"));
  assert.ok(eventModeRules.has("reactlynx/lazy-without-suspense"));
});
