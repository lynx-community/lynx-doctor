import fs from "node:fs";
import path from "node:path";
import type { InstallOptions, InstallResult } from "./types.js";
import { findNearestPackageRoot } from "./project.js";

const WORKFLOW = `name: Lynx Doctor

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  issues: write
  statuses: write

concurrency:
  group: lynx-doctor-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  lynx-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: npx lynx-doctor@latest --diff --blocking warning
`;

const AGENT_GUIDE = `# Lynx Doctor Agent Notes

When Lynx Doctor reports findings, fix the highest severity rules first:

- Threading: keep lynx.getJSModule and NativeModules in background-only contexts.
- Lifecycle: do not use useLayoutEffect in ReactLynx.
- Events: main-thread:* handlers need a top-level 'main thread' directive.
- Configuration: globalPropsMode: 'event' requires explicit useGlobalPropsChanged subscriptions.

After changing code, re-run:

\`\`\`bash
npx lynx-doctor@latest --verbose
\`\`\`
`;

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

const readPackageJson = (packageJsonPath: string): PackageJson | null => {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;
  } catch {
    return null;
  }
};

const writeIfChanged = (
  filePath: string,
  content: string,
  dryRun: boolean,
  changedFiles: string[],
): void => {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (existing === content) return;
  changedFiles.push(filePath);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const installPackageScript = (rootDirectory: string, dryRun: boolean, changedFiles: string[]): string | null => {
  const packageJsonPath = path.join(rootDirectory, "package.json");
  const packageJson = readPackageJson(packageJsonPath);
  if (!packageJson) return "No package.json found; skipped package script.";
  const scripts = { ...(packageJson.scripts ?? {}) };
  if (scripts.doctor === "lynx-doctor --diff") return null;
  scripts.doctor = scripts.doctor ?? "lynx-doctor --diff";
  const nextPackageJson = {
    ...packageJson,
    scripts
  };
  changedFiles.push(packageJsonPath);
  if (!dryRun) fs.writeFileSync(packageJsonPath, `${JSON.stringify(nextPackageJson, null, 2)}\n`);
  return "Added package script: doctor -> lynx-doctor --diff";
};

export const installLynxDoctor = (options: InstallOptions): InstallResult => {
  const rootDirectory = findNearestPackageRoot(options.rootDirectory);
  const dryRun = Boolean(options.dryRun);
  const changedFiles: string[] = [];
  const messages: string[] = [];

  const scriptMessage = installPackageScript(rootDirectory, dryRun, changedFiles);
  if (scriptMessage) messages.push(scriptMessage);

  writeIfChanged(
    path.join(rootDirectory, ".github", "workflows", "lynx-doctor.yml"),
    WORKFLOW,
    dryRun,
    changedFiles,
  );
  messages.push("Installed GitHub Actions workflow for pull request scans.");

  const agentGuidePath = path.join(rootDirectory, ".agents", "lynx-doctor.md");
  writeIfChanged(agentGuidePath, AGENT_GUIDE, dryRun, changedFiles);
  messages.push("Wrote .agents/lynx-doctor.md for coding agents.");

  return {
    rootDirectory,
    changedFiles,
    messages,
    dryRun
  };
};
