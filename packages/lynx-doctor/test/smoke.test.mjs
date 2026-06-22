import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAgentPrompt, scanProject } from "../dist/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const writeFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

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
  assert.match(buildAgentPrompt(report), /Fix the top/);
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
