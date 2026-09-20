import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const writeFile = (root, name, content) => {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

export const writeJson = (root, name, value) => writeFile(root, name, JSON.stringify(value, null, 2));

export const initProject = (root, overrides = {}) => {
  writeJson(root, "package.json", {
    name: "fixture",
    dependencies: { "@lynx-js/react": "3.0.0", "@lynx-js/types": "3.0.0" },
    ...overrides
  });
  writeJson(root, "tsconfig.json", {
    compilerOptions: { jsx: "react-jsx", jsxImportSource: "@lynx-js/react", isolatedModules: true }
  });
};

export const createProject = (t, overrides) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lynx-doctor-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initProject(root, overrides);
  return root;
};

export const git = (root, ...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

export const initGit = (root) => {
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Lynx Doctor Test");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "commit.gpgsign", "false");
  git(root, "config", "core.hooksPath", path.join(root, ".test-hooks"));
};

export const commit = (root, message = "fixture") => {
  git(root, "add", ".");
  git(root, "commit", "-qm", message);
};

export const healthySource = 'export function App() { return <text>hello</text>; }\n';
export const unsafeSource = 'export function App() { const value = NativeModules.Storage.get("key"); return <text>{value}</text>; }\n';
