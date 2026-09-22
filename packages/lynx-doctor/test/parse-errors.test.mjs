import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildAgentPrompt, formatReport, formatScore, scanProject } from "../dist/index.js";
import { commit, createProject, git, healthySource, initGit, unsafeSource, writeFile, writeJson } from "./helpers.mjs";

const brokenFile = "sdk/task/components/CommonDailyTask/styles.test.ts";
const brokenSource = "export const styles = {\n" + "  // fixture\n".repeat(770);
const cli = fileURLToPath(new URL("../bin/lynx-doctor.js", import.meta.url));
const run = (root, ...args) => spawnSync(process.execPath, [cli, root, ...args], {
  encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" }
});

for (const [mode, options] of [["full", {}], ["diff", { diff: true }], ["staged", { staged: true }]]) {
  test(`${mode} scans report an unclosed styles.test.ts and continue checking later files`, async (t) => {
    const root = createProject(t);
    if (mode !== "full") {
      initGit(root);
      commit(root);
    }
    writeFile(root, brokenFile, brokenSource);
    writeFile(root, "src/App.tsx", unsafeSource);
    if (mode === "staged") git(root, "add", ".");

    const report = await scanProject({ directory: root, ...options });
    assert.equal(report.ok, false);
    assert.deepEqual(report.parseErrors, [{ filePath: brokenFile, line: 772, column: 1, message: "'}' expected." }]);
    assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
    assert.equal(report.scope.applicableSourceFiles, 1);
    assert.equal(report.diagnostics.length, 1);
    assert.equal(report.diagnostics[0].filePath, "src/App.tsx");
    assert.equal(report.diagnostics[0].ruleId, "reactlynx/background-only-api");
  });
}

test("parse failures follow the Git index for staged scans and working contents for diff", async (t) => {
  const root = createProject(t);
  initGit(root);
  commit(root);
  writeFile(root, brokenFile, brokenSource);
  writeFile(root, "src/App.tsx", unsafeSource);
  git(root, "add", ".");
  writeFile(root, brokenFile, "export const styles = {};\n");
  writeFile(root, "src/App.tsx", "export const App = () => <view");

  const staged = await scanProject({ directory: root, staged: true });
  assert.deepEqual(staged.parseErrors.map((error) => error.filePath), [brokenFile]);
  assert.deepEqual(staged.scannedFiles, ["src/App.tsx"]);
  assert.equal(staged.summary.errorCount, 1);

  const diff = await scanProject({ directory: root, diff: true });
  assert.deepEqual(diff.parseErrors.map((error) => error.filePath), ["src/App.tsx"]);
  assert.deepEqual(diff.scannedFiles, [brokenFile]);
  assert.equal(diff.summary.errorCount, 0);
});

test("malformed CSS and TypeScript are both reported while later CSS and source are checked", async (t) => {
  const root = createProject(t);
  writeJson(root, "lynx-doctor.config.json", { targets: { android: "3.5" } });
  writeFile(root, "a-broken.css", ".card { filter: blur(2px);");
  writeFile(root, brokenFile, brokenSource);
  writeFile(root, "src/App.tsx", unsafeSource);
  writeFile(root, "src/app.css", ".card { filter: brightness(0.5); }");
  const report = await scanProject({ directory: root });
  assert.equal(report.ok, false);
  assert.deepEqual(report.parseErrors.map((error) => error.filePath), ["a-broken.css", brokenFile]);
  assert.equal(report.parseErrors[0].message, "Unclosed block");
  assert.equal(report.parseErrors[0].line, 1);
  assert.equal(report.parseErrors[0].column, 1);
  assert.deepEqual(report.scannedFiles, ["src/App.tsx", "src/app.css"]);
  assert.equal(report.scope.applicableSourceFiles, 2);
  assert.equal(report.cssCoverage.files, 1);
  assert.equal(report.cssCoverage.declarations, 1);
  assert.equal(report.summary.errorCount, 2);
});

test("parse failures cannot be hidden by rule filters or a nonblocking policy", async (t) => {
  const root = createProject(t);
  writeFile(root, brokenFile, brokenSource);
  const report = await scanProject({ directory: root, blocking: "none", categories: ["lynx-ui"], includeWarnings: false });
  assert.equal(report.ok, false);
  assert.equal(report.parseErrors.length, 1);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.scope.applicableSourceFiles, 0);
  assert.match(formatReport(report), /Scan incomplete: 1 file could not be parsed/);
  assert.match(formatReport(report), /styles\.test\.ts:772:1/);
  assert.doesNotMatch(formatReport(report), /100\/100 healthy|No Lynx Doctor findings|Passes current blocking policy/);
  assert.equal(formatScore(report), "N/A");
  const prompt = buildAgentPrompt(report);
  assert.match(prompt, /styles\.test\.ts:772:1/);
  assert.doesNotMatch(prompt, /Fix the top 0|Current score: 100/);
});

test("intentional invalid fixtures can be explicitly ignored", async (t) => {
  const root = createProject(t);
  writeFile(root, brokenFile, brokenSource);
  writeFile(root, "src/App.tsx", healthySource);
  writeJson(root, "lynx-doctor.config.json", { ignore: { files: [brokenFile] } });
  const report = await scanProject({ directory: root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.parseErrors, []);
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
  assert.equal(formatScore(report), "100");
});

test("CLI emits a complete report on parse errors in text, JSON, score, and agent-prompt modes", (t) => {
  const root = createProject(t);
  writeFile(root, brokenFile, brokenSource);
  writeFile(root, "src/App.tsx", healthySource);

  const text = run(root, "--no-agent-select");
  assert.equal(text.status, 1);
  assert.match(text.stdout, /Scan incomplete/);
  assert.match(text.stdout, /styles\.test\.ts:772:1/);
  assert.doesNotMatch(text.stderr, /lynx-doctor failed/);

  const json = run(root, "--json", "--blocking", "none");
  assert.equal(json.status, 1);
  const report = JSON.parse(json.stdout);
  assert.equal(report.ok, false);
  assert.equal(report.parseErrors.length, 1);
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);

  const score = run(root, "--score");
  assert.equal(score.status, 1);
  assert.equal(score.stdout.trim(), "N/A");

  const prompt = run(root, "--agent-prompt");
  assert.equal(prompt.status, 1);
  assert.match(prompt.stdout, /---- Agent prompt ----/);
  assert.match(prompt.stdout.split("---- Agent prompt ----")[1], /styles\.test\.ts:772:1/);
});
