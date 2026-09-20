import assert from "node:assert/strict";
import test from "node:test";
import { scanProject } from "../dist/index.js";
import { createProject, writeFile, writeJson } from "./helpers.mjs";

const scanSource = async (t, source) => {
  const root = createProject(t);
  writeFile(root, "src/App.tsx", source);
  return scanProject({ directory: root });
};
const threads = (report) => report.diagnostics.filter((d) =>
  ["reactlynx/background-only-api", "reactlynx/avoid-use-layout-effect", "reactlynx/main-thread-handler-directive"].includes(d.ruleId));

test("thread rules ignore comments, strings, type positions, and shadowed globals", async (t) => {
  const report = await scanSource(t, `
// NativeModules.Storage.get(); lynx.getJSModule('Storage'); useLayoutEffect();
const example = "NativeModules.Storage.get()";
type NativeModules = { value: string };
function local(NativeModules: { read(): void }, lynx: { getJSModule(): void }) {
  NativeModules.read(); lynx.getJSModule();
}
const object = { NativeModules: true };
export const App = () => <text>{example}</text>;
`);
  assert.deepEqual(threads(report), []);
});

test("background scope follows syntax, not nearby lines or directives", async (t) => {
  const report = await scanSource(t, `import { useEffect as effect } from '@lynx-js/react';
export function App() {
  effect(() => { NativeModules.Safe.run(); }, []);
  const bad = lynx.getJSModule('Unsafe');
  function marked() {
    'background only';
    ${"// a long function\n".repeat(20)}
    NativeModules.Safe.run();
  }
  function late() { const value = 1; 'background only'; NativeModules.Unsafe.run(); }
  return <view bindtap={marked} />;
}`);
  assert.equal(threads(report).length, 2);
  assert.ok(threads(report).every((d) => d.ruleId === "reactlynx/background-only-api"));
  assert.equal(threads(report)[0].line, 4);
});

test("background inference handles hooks, native callbacks, and exclusively background helpers", async (t) => {
  const report = await scanSource(t, `import * as ReactLynx from '@lynx-js/react';
function work() { NativeModules.Safe.run(); }
const onTap = () => { lynx.getJSModule('Safe'); };
export function App() {
  ReactLynx.useEffect(() => { work(); }, []);
  ReactLynx.useImperativeHandle(null, () => { NativeModules.Safe.run(); return {}; });
  return <view bindtap={onTap} ref={() => { NativeModules.Safe.run(); }} />;
}`);
  assert.deepEqual(threads(report), []);
});

test("custom callback boundaries, mixed callers, exports, and hook shadowing stay conservative", async (t) => {
  const report = await scanSource(t, `import { useEffect } from '@lynx-js/react';
function mixed() { NativeModules.Mixed.run(); }
function escaped() { NativeModules.Exported.run(); }
export { escaped };
export function App() {
  mixed();
  useEffect(() => mixed(), []);
  function nested(useEffect: Function) { useEffect(() => NativeModules.Shadowed.run()); }
  return <Custom bindtap={() => NativeModules.Custom.run()} />;
}`);
  assert.equal(threads(report).length, 4);
});

test("background-only modules do not report background API reads", async (t) => {
  const report = await scanSource(t, `import 'background-only';
export const service = NativeModules.Storage;
export function run() { lynx.getJSModule('Storage'); }`);
  assert.deepEqual(threads(report), []);
});

test("layout effects resolve import aliases and ignore unrelated functions", async (t) => {
  const report = await scanSource(t, `import { useLayoutEffect as layout } from '@lynx-js/react';
import * as Lynx from '@lynx-js/react';
function useLayoutEffect() {}
useLayoutEffect();
layout(() => {}, []);
Lynx.useLayoutEffect(() => {}, []);
function nested(layout: Function) { layout(); }
`);
  assert.deepEqual(threads(report).map((d) => d.line), [5, 6]);
});

test("main-thread handlers support multiline typed functions, aliases, and lexical shadowing", async (t) => {
  const report = await scanSource(t, `import { external } from './external';
const valid = (event: unknown): void => { /* a comment */ 'main thread'; };
const alias = valid;
function bad(): void { const text = 'main thread'; }
export function App() {
  function valid() { console.log('shadowed'); }
  return <view main-thread:bindtap={valid} />;
}
export const Other = () => <view
  main-thread:bindtap={alias}
  main-thread:bindtouchstart={external}
  main-thread:bindtouchend={bad}
  main-thread:bindtouchmove={(event): void => {
    console.log('missing directive');
  }}
/>;
`);
  assert.deepEqual(threads(report).map((d) => d.line), [7, 12, 13]);
  assert.ok(threads(report).every((d) => d.ruleId === "reactlynx/main-thread-handler-directive"));
});

test("explicit React DOM files are excluded from ReactLynx checks", async (t) => {
  const report = await scanSource(t, `import { useLayoutEffect } from 'react';
export const Web = () => { useLayoutEffect(() => {}, []); return <div />; };`);
  assert.deepEqual(report.diagnostics, []);
});

test("invalid source syntax fails with location instead of a healthy report", async (t) => {
  await assert.rejects(() => scanSource(t, "export const App = () => <view"), /Cannot parse .*App.tsx:1:/);
});

test("TypeScript JSONC and multiple extends use effective compiler options", async (t) => {
  const root = createProject(t);
  writeFile(root, "base.json", `{
    // Shared compiler options
    "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "@lynx-js/react", },
  }`);
  writeJson(root, "modules.json", { compilerOptions: { isolatedModules: true } });
  writeJson(root, "tsconfig.json", { extends: ["./base.json", "./modules.json"] });
  assert.deepEqual((await scanProject({ directory: root })).diagnostics, []);
  writeJson(root, "tsconfig.json", {
    extends: ["./base.json", "./modules.json"], compilerOptions: { jsxImportSource: "react", isolatedModules: false }
  });
  assert.equal((await scanProject({ directory: root })).diagnostics.length, 2);
});

test("package-based tsconfig extends and preserved JSX are accepted", async (t) => {
  const root = createProject(t);
  writeJson(root, "node_modules/@fixture/tsconfig/package.json", { name: "@fixture/tsconfig", tsconfig: "base.json" });
  writeJson(root, "node_modules/@fixture/tsconfig/base.json", { compilerOptions: { jsx: "preserve", verbatimModuleSyntax: true } });
  writeJson(root, "tsconfig.json", { extends: "@fixture/tsconfig" });
  assert.deepEqual((await scanProject({ directory: root })).diagnostics, []);
});

test("missing or malformed inherited TypeScript configuration is actionable", async (t) => {
  const root = createProject(t);
  writeJson(root, "tsconfig.json", { extends: "./missing.json" });
  await assert.rejects(() => scanProject({ directory: root }), /Cannot read .*tsconfig.json:.*missing.json/);
  writeFile(root, "tsconfig.json", '{ "compilerOptions": { "jsx": ');
  await assert.rejects(() => scanProject({ directory: root }), /Cannot read .*tsconfig.json/);
});
