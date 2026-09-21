import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { formatReport, scanProject } from "../dist/index.js";
import { commit, createProject, git, healthySource, initGit, unsafeSource, writeFile, writeJson } from "./helpers.mjs";

const binaryBundle = Buffer.from("343643002219240007000000302e322eff", "hex");
const invalidUtf8 = Buffer.from([0xff, 0xfe, 0xfd]);
const cli = fileURLToPath(new URL("../bin/lynx-doctor.js", import.meta.url));

for (const [mode, options] of [["full", {}], ["diff", { diff: true }], ["staged", { staged: true }]]) {
  test(`${mode} scans skip binary content before parsing and still diagnose source files`, async (t) => {
    const root = createProject(t);
    writeJson(root, "lynx-doctor.config.json", { targets: { android: "3.5" } });
    if (mode !== "full") {
      initGit(root);
      commit(root);
    }
    const binaryFiles = ["assets/data.css", "src/data.ts", "www/a2ui.lynx.js", "www/encoded.mjs"];
    writeFile(root, binaryFiles[0], binaryBundle);
    writeFile(root, binaryFiles[1], Buffer.from([0x41, 0, 0x42]));
    writeFile(root, binaryFiles[2], binaryBundle);
    writeFile(root, binaryFiles[3], invalidUtf8);
    writeFile(root, "src/App.tsx", unsafeSource);
    writeFile(root, "src/empty.ts", "");
    writeFile(root, "www/text.lynx.js", '\uFEFFexport const text = "你好 🌍 � \\0";\n');
    if (mode === "staged") git(root, "add", ".");

    const report = await scanProject({ directory: root, ...options });
    assert.deepEqual(report.scannedFiles, ["src/App.tsx", "src/empty.ts", "www/text.lynx.js"]);
    assert.equal(report.scope.applicableSourceFiles, 3);
    assert.equal(report.cssCoverage.files, 0);
    assert.equal(report.cssCoverage.declarations, 0);
    assert.equal(report.summary.errorCount, 1);
    assert.equal(report.diagnostics[0].filePath, "src/App.tsx");
    assert.equal(report.ok, false);
    assert.deepEqual(report.notices, binaryFiles.map((file) => `Skipped binary or non-UTF-8 file: ${file}`));
    assert.match(formatReport(report), /Note: Skipped binary or non-UTF-8 file: www\/a2ui\.lynx\.js/);
  });
}

test("binary detection uses the selected Git snapshot", async (t) => {
  const root = createProject(t);
  initGit(root);
  commit(root);
  writeFile(root, "www/a2ui.lynx.js", binaryBundle);
  writeFile(root, "src/App.tsx", unsafeSource);
  git(root, "add", ".");
  writeFile(root, "www/a2ui.lynx.js", "export const value = 1;\n");
  writeFile(root, "src/App.tsx", binaryBundle);

  const staged = await scanProject({ directory: root, staged: true });
  assert.deepEqual(staged.scannedFiles, ["src/App.tsx"]);
  assert.equal(staged.summary.errorCount, 1);
  assert.deepEqual(staged.notices, ["Skipped binary or non-UTF-8 file: www/a2ui.lynx.js"]);

  const working = await scanProject({ directory: root, diff: true });
  assert.deepEqual(working.scannedFiles, ["www/a2ui.lynx.js"]);
  assert.equal(working.summary.errorCount, 0);
  assert.deepEqual(working.notices, ["Skipped binary or non-UTF-8 file: src/App.tsx"]);
});

test("binary-only projects report no applicable source coverage", async (t) => {
  const root = createProject(t);
  writeFile(root, "www/a2ui.lynx.js", binaryBundle);
  const report = await scanProject({ directory: root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.scannedFiles, []);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.scope.applicableSourceFiles, 0);
  assert.match(formatReport(report), /No applicable Lynx source files were checked/);
  assert.doesNotMatch(formatReport(report), /100\/100 healthy/);
});

test("CLI completes with binary artifacts and includes skip notices in JSON", (t) => {
  const root = createProject(t);
  writeFile(root, "www/a2ui.lynx.js", binaryBundle);
  writeFile(root, "src/App.tsx", healthySource);
  const result = spawnSync(process.execPath, [cli, root, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
  assert.deepEqual(report.notices, ["Skipped binary or non-UTF-8 file: www/a2ui.lynx.js"]);
});
