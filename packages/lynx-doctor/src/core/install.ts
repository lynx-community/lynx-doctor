import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { VERSION, type InstallOptions, type InstallResult } from "./types.js";
import { findNearestPackageRoot } from "./project.js";

const doctorCommand = `npx --yes lynx-doctor@${VERSION}`;
interface PackageJson {
  scripts?: Record<string, string>;
  packageManager?: string;
  [key: string]: unknown;
}

const readPackageJson = (filePath: string): PackageJson => {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("expected an object");
    return value as PackageJson;
  } catch (error) {
    throw new Error(`Cannot read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const repositoryRoot = (directory: string): string => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch { return directory; }
};

const dependencySteps = (gitRoot: string, project: string): string => {
  const root = fs.existsSync(path.join(gitRoot, "package.json")) ? gitRoot : project;
  // Windows temp paths can use 8.3 aliases while Git reports long paths.
  const directory = path.relative(fs.realpathSync.native(gitRoot), fs.realpathSync.native(root)).split(path.sep).join("/") || ".";
  const has = (name: string) => fs.existsSync(path.join(root, name));
  const manager = has("package.json") ? readPackageJson(path.join(root, "package.json")).packageManager ?? "" : "";
  let setup = "";
  let command: string;
  if (has("pnpm-lock.yaml") || manager.startsWith("pnpm@")) {
    command = `npm install --global corepack@latest\ncorepack enable\npnpm install${has("pnpm-lock.yaml") ? " --frozen-lockfile" : ""}`;
  } else if (has("yarn.lock") || manager.startsWith("yarn@")) {
    const classic = manager.startsWith("yarn@1.") || (has("yarn.lock") && fs.readFileSync(path.join(root, "yarn.lock"), "utf8").includes("# yarn lockfile v1"));
    command = `npm install --global corepack@latest\ncorepack enable\nyarn install${has("yarn.lock") ? classic ? " --frozen-lockfile" : " --immutable" : ""}`;
  } else if (has("bun.lock") || has("bun.lockb") || manager.startsWith("bun@")) {
    setup = "      - uses: oven-sh/setup-bun@v2\n";
    command = `bun install${has("bun.lock") || has("bun.lockb") ? " --frozen-lockfile" : ""}`;
  } else {
    command = has("package-lock.json") || has("npm-shrinkwrap.json") ? "npm ci" : "npm install";
  }
  return `${setup}      - name: Install project dependencies
        working-directory: ${JSON.stringify(directory)}
        run: |
${command.split("\n").map((line) => `          ${line}`).join("\n")}
`;
};

const workflow = (root: string, project: string): string => {
  const directory = path.relative(fs.realpathSync.native(root), fs.realpathSync.native(project)).split(path.sep).join("/") || ".";
  return `name: Lynx Doctor

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: lynx-doctor-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  lynx-doctor:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${JSON.stringify(directory)}
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
          persist-credentials: false
          ref: \${{ github.event.pull_request.head.sha || github.sha }}
      - uses: actions/setup-node@v5
        with:
          node-version: 22.20.0
${dependencySteps(root, project)}      - name: Check pull request changes
        if: github.event_name == 'pull_request'
        env:
          DOCTOR_BASE: \${{ github.event.pull_request.base.sha }}
        run: ${doctorCommand} --diff "$DOCTOR_BASE" --blocking warning
      - name: Check full project
        if: github.event_name != 'pull_request'
        run: ${doctorCommand} --blocking warning
`;
};

const agentGuide = `# Lynx Doctor Agent Notes

Fix the highest severity findings first. Read each rule's pinned source and the affected files before editing. Correct the root cause instead of suppressing diagnostics.

After changing code, re-run the same installed version:

\`\`\`bash
${doctorCommand} --verbose
\`\`\`

For CSS compatibility, configure minimum Lynx engine versions in targets. For component libraries, build first and then run with --package. After staged scans, stage reviewed fixes and check the index again before committing.
`;

export const installLynxDoctor = (options: InstallOptions): InstallResult => {
  const rootDirectory = findNearestPackageRoot(options.rootDirectory);
  const packagePath = path.join(rootDirectory, "package.json");
  const pkg = readPackageJson(packagePath);
  const dryRun = Boolean(options.dryRun);
  const changedFiles: string[] = [];
  const messages: string[] = [];
  if (pkg.scripts?.doctor !== undefined) {
    messages.push("Kept existing doctor script.");
  } else {
    const next = { ...pkg, scripts: { ...(pkg.scripts ?? {}), doctor: doctorCommand } };
    changedFiles.push(packagePath);
    if (!dryRun) fs.writeFileSync(packagePath, `${JSON.stringify(next, null, 2)}\n`);
    messages.push(`${dryRun ? "Would add" : "Added"} doctor script: ${doctorCommand}`);
  }
  const createOnly = (filePath: string, content: () => string): void => {
    if (fs.existsSync(filePath)) { messages.push(`Kept existing ${filePath}.`); return; }
    const next = content();
    changedFiles.push(filePath);
    if (!dryRun) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, next);
    }
    messages.push(`${dryRun ? "Would create" : "Created"} ${filePath}.`);
  };
  const gitRoot = repositoryRoot(rootDirectory);
  createOnly(path.join(gitRoot, ".github", "workflows", "lynx-doctor.yml"), () => workflow(gitRoot, rootDirectory));
  createOnly(path.join(rootDirectory, ".agents", "lynx-doctor.md"), () => agentGuide);
  return { rootDirectory, changedFiles, messages, dryRun };
};
