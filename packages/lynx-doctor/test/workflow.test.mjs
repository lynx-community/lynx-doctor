import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { formatReport, installLynxDoctor, scanProject, VERSION, buildAgentPrompt } from "../dist/index.js";
import { commit, createProject, git, healthySource, initGit, initProject, unsafeSource, writeFile, writeJson } from "./helpers.mjs";

const cli = fileURLToPath(new URL("../bin/lynx-doctor.js", import.meta.url));
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const run = (args, options = {}) => spawnSync(process.execPath, [cli, ...args], {
  encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" }, ...options
});
const read = (root, file) => fs.readFileSync(path.join(root, file), "utf8");

test("CLI, API, installer, and agent prompts share the package version", async (t) => {
  assert.equal(VERSION, pkg.version);
  assert.equal(run(["--version"]).stdout.trim(), pkg.version);
  const root = createProject(t);
  writeFile(root, "App.tsx", unsafeSource);
  installLynxDoctor({ rootDirectory: root });
  const manifest = JSON.parse(read(root, "package.json"));
  assert.equal(manifest.scripts.doctor, `npx --yes lynx-doctor@${pkg.version}`);
  assert.match(read(root, ".github/workflows/lynx-doctor.yml"), new RegExp(`lynx-doctor@${pkg.version.replaceAll(".", "\\.")}`));
  assert.ok(buildAgentPrompt(await scanProject({ directory: root })).includes(`lynx-doctor@${pkg.version}`));
});

test("installer dry run is accurate and repeat installs preserve all existing content", (t) => {
  const root = createProject(t);
  const before = read(root, "package.json");
  const preview = installLynxDoctor({ rootDirectory: root, dryRun: true });
  assert.equal(preview.changedFiles.length, 3);
  assert.equal(read(root, "package.json"), before);
  assert.equal(fs.existsSync(path.join(root, ".github")), false);
  const actual = installLynxDoctor({ rootDirectory: root });
  assert.deepEqual(actual.changedFiles, preview.changedFiles);
  assert.deepEqual(installLynxDoctor({ rootDirectory: root }).changedFiles, []);

  const manifest = JSON.parse(read(root, "package.json"));
  writeJson(root, "package.json", { ...manifest, scripts: { doctor: "custom-doctor --strict" } });
  writeFile(root, ".github/workflows/lynx-doctor.yml", "name: Custom workflow\n");
  writeFile(root, ".agents/lynx-doctor.md", "Custom team instructions\n");
  const protectedFiles = actual.changedFiles.map((file) => fs.readFileSync(file, "utf8"));
  const result = installLynxDoctor({ rootDirectory: root, yes: true });
  assert.deepEqual(result.changedFiles, []);
  assert.deepEqual(actual.changedFiles.map((file) => fs.readFileSync(file, "utf8")), protectedFiles);
  assert.ok(result.messages.every((message) => message.startsWith("Kept existing")));
});

test("monorepo installs put workflows at Git root and use actual PR base with read permissions", (t) => {
  const root = createProject(t);
  initGit(root);
  writeFile(root, "pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  const app = path.join(root, "apps", "mobile app");
  initProject(app);
  const result = installLynxDoctor({ rootDirectory: app });
  const workflowPath = fs.realpathSync.native(path.join(root, ".github/workflows/lynx-doctor.yml"));
  assert.ok(result.changedFiles.some((file) => fs.realpathSync.native(file) === workflowPath));
  assert.equal(fs.existsSync(path.join(app, ".github")), false);
  const workflow = read(root, ".github/workflows/lynx-doctor.yml");
  assert.match(workflow, /working-directory: "apps\/mobile app"/);
  assert.match(workflow, /working-directory: "\."/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /github.event.pull_request.base.sha/);
  assert.match(workflow, /--diff "\$DOCTOR_BASE"/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /pull-requests: write|issues: write|statuses: write|@latest --diff/);
  assert.match(workflow, /Check full project/);
});

test("installer selects dependency commands for npm, Yarn, and Bun lockfiles", (t) => {
  for (const [lock, content, expected] of [
    ["package-lock.json", "{}", "npm ci"],
    ["yarn.lock", "# yarn lockfile v1", "yarn install --frozen-lockfile"],
    ["bun.lock", "{}", "bun install --frozen-lockfile"]
  ]) {
    const root = createProject(t);
    writeFile(root, lock, content);
    installLynxDoctor({ rootDirectory: root });
    assert.ok(read(root, ".github/workflows/lynx-doctor.yml").includes(expected));
  }
});

test("standalone Doctor resolves typed defineConfig without a project-local installation", async (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", unsafeSource);
  writeFile(root, "lynx-doctor.config.ts", `import { defineConfig } from 'lynx-doctor';
export default defineConfig({ rules: { 'reactlynx/background-only-api': 'warning' } });`);
  const report = await scanProject({ directory: root });
  assert.equal(report.diagnostics[0].severity, "warning");
  assert.equal(report.ok, true);
});

const agentCommand = (root, source) => {
  const directory = "test agent";
  const script = path.join(root, directory, "agent.cjs");
  writeFile(root, `${directory}/agent.cjs`, `process.stdin.resume(); process.stdin.on('end', () => { ${source} });\n`);
  if (process.platform === "win32") {
    const command = path.join(root, directory, "agent.cmd");
    writeFile(root, `${directory}/agent.cmd`, `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);
    return command;
  }
  const command = path.join(root, directory, "agent");
  writeFile(root, `${directory}/agent`, `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`);
  fs.chmodSync(command, 0o755);
  return command;
};

test("successful agents are verified and the updated report controls the exit status", (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", unsafeSource);
  const command = agentCommand(root, `require('node:fs').writeFileSync('App.tsx', ${JSON.stringify(healthySource)});`);
  const result = run([root, "--agent", command]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verification after agent: full working-tree scan/);
  assert.match(result.stdout, /100\/100 healthy/);
  assert.equal(read(root, "App.tsx"), healthySource);
});

test("parse errors can be handed to an agent and must be resolved during verification", (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", "export const App = () => <view");
  const command = agentCommand(root, "process.exitCode = 0;");
  const unresolved = run([root, "--agent", command, "--blocking", "none"]);
  assert.equal(unresolved.status, 1);
  assert.match(unresolved.stdout, /Verification after agent/);
  assert.match(unresolved.stdout, /Scan incomplete/);

  agentCommand(root, `require('node:fs').writeFileSync('App.tsx', ${JSON.stringify(healthySource)});`);
  const fixed = run([root, "--agent", command]);
  assert.equal(fixed.status, 0, fixed.stderr);
  assert.match(fixed.stdout, /Verification after agent/);
  assert.match(fixed.stdout, /100\/100 healthy/);
  assert.equal(read(root, "App.tsx"), healthySource);
});

test("no-op or failed agents cannot turn unresolved findings into a successful run", (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", unsafeSource);
  const command = agentCommand(root, "process.exitCode = 0;");
  let result = run([root, "--agent", command]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Verification after agent/);
  agentCommand(root, "process.exitCode = 7;");
  result = run([root, "--agent", command, "--blocking", "none"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Agent handoff failed/);
  assert.match(result.stderr, /exited with code 7/);
});

test("bare --agent uses the configured command but config alone never launches an agent", (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", unsafeSource);
  const command = agentCommand(root, `require('node:fs').writeFileSync('App.tsx', ${JSON.stringify(healthySource)});`);
  writeJson(root, "lynx-doctor.config.json", { agent: { command } });
  assert.equal(run([root, "--json"]).status, 1);
  assert.equal(read(root, "App.tsx"), unsafeSource);
  const result = run([root, "--agent"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(root, "App.tsx"), healthySource);
});

test("post-agent staged verification cannot pass with only unstaged fixes", (t) => {
  const root = createProject(t);
  initGit(root); commit(root);
  writeFile(root, "App.tsx", unsafeSource); git(root, "add", "App.tsx");
  const command = agentCommand(root, `require('node:fs').writeFileSync('App.tsx', ${JSON.stringify(healthySource)});`);
  const result = run([root, "--staged", "--agent", command]);
  assert.equal(result.status, 1);
  assert.equal(read(root, "App.tsx"), healthySource);
  assert.match(result.stdout, /Verification after agent: staged snapshot/);
  assert.match(result.stdout, /Stage reviewed fixes/);
});

test("machine output stays parseable and rejects interactive handoff combinations", (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", healthySource);
  const json = run([root, "--json", "--json-compact"]);
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).scope.mode, "full");
  for (const args of [["--json", "--agent", "codex"], ["--score", "--agent-prompt"], ["--json", "--score"]]) {
    const result = run([root, ...args]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /require text output|Choose either/);
  }
});

test("empty and non-Lynx scans do not claim full source health", async (t) => {
  const root = createProject(t, { dependencies: {} });
  writeFile(root, "index.js", "export const answer = 42;");
  const report = await scanProject({ directory: root });
  assert.equal(report.scope.applicableSourceFiles, 0);
  assert.doesNotMatch(formatReport(report), /100\/100 healthy/);
  assert.match(formatReport(report), /No applicable Lynx source files/);
});
