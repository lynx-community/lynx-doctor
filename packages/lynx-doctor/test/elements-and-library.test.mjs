import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { scanProject } from "../dist/index.js";
import { createProject, writeFile, writeJson } from "./helpers.mjs";

test("native element events and common Web tags are distinguished from component props", async (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", `
// <view onClick={tap} />
export const App = () => <view
  onClick={() => {}}
  onTouchStart={() => {}}
>
  <div><span>Web text</span><img src="x" /></div>
  <Button onClick={() => {}} />
  <custom-view onClick={() => {}} />
  <text bindtap={() => {}}>native</text>
</view>;
`);
  const report = await scanProject({ directory: root });
  assert.equal(report.diagnostics.filter((d) => d.ruleId === "reactlynx/native-element-events").length, 2);
  assert.equal(report.diagnostics.filter((d) => d.ruleId === "reactlynx/no-dom-elements").length, 3);
  assert.equal(report.diagnostics.length, 5);
  assert.ok(report.diagnostics.every((d) => d.source.skill === "lynx-api-docs"));
});

test("lynx-ui Button checks handle aliases, multiline JSX, and shadowed names", async (t) => {
  const root = createProject(t);
  writeFile(root, "App.tsx", `import { Button as Action } from '@lynx-js/lynx-ui';
export const App = () => <Action
  bindtap={() => {}}
  buttonProps={{ catchtap: () => {} }}
/>;
export function Custom(Action: any) { return <Action bindtap={() => {}} />; }
export const Good = () => <Action onClick={() => {}} />;
`);
  const report = await scanProject({ directory: root });
  const button = report.diagnostics.filter((d) => d.ruleId === "lynx-ui/button-uses-on-click");
  assert.equal(button.length, 1);
  assert.equal(button[0].line, 3);
});

test("Web source files in a mixed package keep their DOM and event contracts", async (t) => {
  const root = createProject(t);
  writeFile(root, "Web.tsx", `import { createRoot } from 'react-dom/client';
const Web = () => <div onClick={() => {}}><span>web</span></div>;`);
  assert.deepEqual((await scanProject({ directory: root })).diagnostics, []);
});

const libraryPackage = (extra = {}) => ({
  name: "fixture-library", peerDependencies: { "@lynx-js/react": "^0.121.0" },
  dependencies: { "@lynx-js/types": "3.0.0" },
  exports: { ".": { types: "./dist/index.d.ts", default: "./dist/index.jsx" } },
  ...extra
});

test("library metadata checks raw default entries without requiring a build", async (t) => {
  const root = createProject(t, libraryPackage({
    exports: { ".": { types: "./dist/index.d.ts", source: "./src/index.tsx", default: "./src/index.tsx" } }
  }));
  const report = await scanProject({ directory: root });
  assert.deepEqual(report.diagnostics.map((d) => d.ruleId), ["reactlynx/library-runtime-entry"]);
  assert.match(report.diagnostics[0].message, /exports...default.*src\/index.tsx/);
});

test("built library entries can preserve JSX and expose explicit source without false positives", async (t) => {
  const root = createProject(t, libraryPackage({
    "jsnext:source": "./src/index.tsx",
    exports: { ".": { types: "./dist/index.d.ts", source: "./src/index.tsx", default: "./dist/index.jsx" } }
  }));
  writeFile(root, "dist/index.jsx", "export const Label = () => <text>hello</text>;");
  writeFile(root, "dist/index.d.ts", "export declare const Label: () => unknown;");
  const report = await scanProject({ directory: root, package: true });
  assert.deepEqual(report.diagnostics, []);
  assert.match(report.notices.join(" "), /do not run builds or verify npm tarball inclusion/);
  const cli = fileURLToPath(new URL("../bin/lynx-doctor.js", import.meta.url));
  const output = execFileSync(process.execPath, [cli, root, "--package", "--json"], { encoding: "utf8" });
  assert.equal(JSON.parse(output).ok, true);
});

test("explicit artifact checks catch extension mismatches and missing declarations", async (t) => {
  const root = createProject(t, libraryPackage({
    exports: { ".": { types: "./dist/index.d.ts", default: "./dist/index.js" } }
  }));
  writeFile(root, "dist/index.jsx", "export const Label = () => <text>hello</text>;");
  const report = await scanProject({ directory: root, package: true });
  assert.equal(report.diagnostics.length, 2);
  assert.ok(report.diagnostics.every((d) => d.ruleId === "reactlynx/library-missing-artifact"));
  assert.equal(report.ok, false);
  await assert.rejects(() => scanProject({ directory: root, package: true, staged: true }), /run it separately/);
});

test("application entry projects are not mistaken for component libraries", async (t) => {
  const root = createProject(t, { main: "./src/App.tsx" });
  assert.deepEqual((await scanProject({ directory: root, package: true })).diagnostics, []);
});

test("wildcards, fallbacks, and paths outside the package have explicit boundaries", async (t) => {
  const root = createProject(t, libraryPackage({
    exports: { "./wild/*": "./dist/*.js", "./fallback": ["./missing.js", "./ok.js"], ".": "../outside.js" }
  }));
  const report = await scanProject({ directory: root, package: true });
  assert.equal(report.diagnostics.length, 1);
  assert.match(report.diagnostics[0].message, /outside.js/);
  assert.match(report.notices.join(" "), /fallbacks/);
  assert.match(report.notices.join(" "), /not expanded/);
});
