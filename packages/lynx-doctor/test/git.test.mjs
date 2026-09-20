import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { scanProject } from "../dist/index.js";
import { commit, createProject, git, healthySource, initGit, initProject, unsafeSource, writeFile, writeJson } from "./helpers.mjs";

test("diff includes committed, staged, working and untracked source changes exactly once", async (t) => {
  const root = createProject(t);
  for (const name of ["committed", "staged", "working"]) writeFile(root, "src/" + name + ".tsx", healthySource);
  initGit(root);
  commit(root);
  git(root, "switch", "-qc", "feature");
  writeFile(root, "src/committed.tsx", unsafeSource);
  commit(root);
  writeFile(root, "src/staged.tsx", unsafeSource);
  git(root, "add", "src/staged.tsx");
  writeFile(root, "src/working.tsx", unsafeSource);
  writeFile(root, "src/页面 file.tsx", unsafeSource);
  const report = await scanProject({ directory: root, diff: "main" });
  assert.deepEqual(report.scannedFiles, ["src/committed.tsx", "src/staged.tsx", "src/working.tsx", "src/页面 file.tsx"]);
  assert.equal(report.summary.errorCount, 4);
  assert.equal(report.ok, false);
});

test("default diff sees local changes on main and respects file ignores", async (t) => {
  const root = createProject(t);
  writeJson(root, "lynx-doctor.config.json", { ignore: { files: ["src/generated/**"] } });
  writeFile(root, "src/App.tsx", healthySource);
  writeFile(root, "src/generated/data.tsx", healthySource);
  initGit(root);
  commit(root);
  writeFile(root, "src/App.tsx", unsafeSource);
  writeFile(root, "src/generated/data.tsx", unsafeSource);
  writeFile(root, "dist/output.tsx", unsafeSource);
  const report = await scanProject({ directory: root, diff: true });
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
  assert.equal(report.summary.errorCount, 1);
});

test("subproject diff resolves Git paths and excludes sibling packages", async (t) => {
  const root = createProject(t);
  const app = path.join(root, "apps/mobile");
  initProject(app);
  writeFile(app, "src/App.tsx", healthySource);
  writeFile(root, "apps/other/App.tsx", healthySource);
  initGit(root);
  commit(root);
  git(root, "switch", "-qc", "feature");
  writeFile(app, "src/App.tsx", unsafeSource);
  writeFile(root, "apps/other/App.tsx", unsafeSource);
  commit(root);
  const report = await scanProject({ directory: app, diff: "main" });
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
  assert.equal(report.summary.errorCount, 1);
});

test("staged scans the index even when the working file is fixed or removed", async (t) => {
  const root = createProject(t);
  writeFile(root, "src/App.tsx", healthySource);
  initGit(root);
  commit(root);
  writeFile(root, "src/App.tsx", unsafeSource);
  git(root, "add", "src/App.tsx");
  writeFile(root, "src/App.tsx", healthySource);
  assert.equal((await scanProject({ directory: root, staged: true })).summary.errorCount, 1);
  fs.unlinkSync(path.join(root, "src/App.tsx"));
  const report = await scanProject({ directory: root, staged: true });
  assert.equal(report.summary.errorCount, 1);
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
});

test("staged ignores unstaged regressions and ignored staged files", async (t) => {
  const root = createProject(t);
  writeJson(root, "lynx-doctor.config.json", { ignore: { files: ["src/generated/**"] } });
  writeFile(root, "src/App.tsx", healthySource);
  initGit(root);
  commit(root);
  writeFile(root, "src/App.tsx", healthySource + "// staged\n");
  writeFile(root, "src/generated/data.tsx", unsafeSource);
  git(root, "add", ".");
  writeFile(root, "src/App.tsx", unsafeSource);
  const report = await scanProject({ directory: root, staged: true });
  assert.deepEqual(report.scannedFiles, ["src/App.tsx"]);
  assert.equal(report.summary.errorCount, 0);
});

test("renames and deletions do not read stale paths", async (t) => {
  const root = createProject(t);
  writeFile(root, "src/old.tsx", unsafeSource);
  writeFile(root, "src/deleted.tsx", healthySource);
  initGit(root);
  commit(root);
  git(root, "switch", "-qc", "feature");
  git(root, "mv", "src/old.tsx", "src/new.tsx");
  git(root, "rm", "src/deleted.tsx");
  commit(root);
  const report = await scanProject({ directory: root, diff: "main" });
  assert.deepEqual(report.scannedFiles, ["src/new.tsx"]);
  assert.equal(report.summary.errorCount, 1);
});

test("new repositories work without HEAD or a base branch", async (t) => {
  const root = createProject(t);
  initGit(root);
  writeFile(root, "src/App.tsx", unsafeSource);
  assert.equal((await scanProject({ directory: root, diff: true })).summary.errorCount, 1);
  git(root, "add", ".");
  assert.equal((await scanProject({ directory: root, staged: true })).summary.errorCount, 1);
});

test("invalid Git requests fail instead of silently scanning everything", async (t) => {
  const root = createProject(t);
  await assert.rejects(scanProject({ directory: root, diff: true }), /require a Git working tree/);
  initGit(root);
  commit(root);
  await assert.rejects(scanProject({ directory: root, diff: "does-not-exist" }), /Cannot resolve/);
  await assert.rejects(scanProject({ directory: root, diff: true, staged: true }), /either --staged or --diff/);
});
