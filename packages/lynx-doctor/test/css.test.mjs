import assert from "node:assert/strict";
import test from "node:test";
import { formatReport, scanProject } from "../dist/index.js";
import { commit, createProject, git, initGit, writeFile, writeJson } from "./helpers.mjs";

const configure = (root, targets, extra = {}) => writeJson(root, "lynx-doctor.config.json", { targets, ...extra });

test("CSS checks exact platform and engine minima, including nested functions", async (t) => {
  const root = createProject(t);
  configure(root, { android: "3.5", ios: "3.6", web_lynx: "3.5" });
  writeFile(root, "src/app.css", "/* filter: brightness(0.5); */\n.card {\n  filter: blur(2px) brightness(0.5);\n}");
  const report = await scanProject({ directory: root });
  assert.equal(report.diagnostics.length, 1);
  assert.equal(report.diagnostics[0].ruleId, "lynx-css/requires-newer-version");
  assert.equal(report.diagnostics[0].line, 3);
  assert.equal(report.diagnostics[0].column, 3);
  assert.match(report.diagnostics[0].message, /filter.brightness requires Lynx 3.6.*android.*target Lynx 3.5.*0.0.16/);
  assert.equal(report.diagnostics[0].source.skill, "lynx-check-css-support");
  assert.equal(report.cssCoverage.status, "checked");
  assert.equal(report.cssCoverage.declarations, 1);
  configure(root, { android: "3.10" });
  assert.deepEqual((await scanProject({ directory: root })).diagnostics, []);
});

test("explicitly unsupported CSS differs from unknown and partial support", async (t) => {
  const root = createProject(t);
  configure(root, { android: "3.7", clay_macos: "3.7" });
  writeFile(root, "src/app.css", ".card { cursor: pointer; mystery-property: value; }");
  const report = await scanProject({ directory: root });
  assert.deepEqual(report.diagnostics.map((d) => d.ruleId), ["lynx-css/unsupported", "lynx-css/conditional-support"]);
  assert.match(report.diagnostics[1].message, /partial support.*Keyword values only/);
  assert.equal(report.cssCoverage.unknownComparisons, 2);
  assert.match(formatReport(report), /data is unknown for 2/);
});

test("conditional CSS requirements are not decided from the engine version", async (t) => {
  const root = createProject(t);
  configure(root, { android: "3.7" });
  writeFile(root, "src/app.css", ".card { grid-template-columns: max-content; }");
  const report = await scanProject({ directory: root });
  assert.equal(report.diagnostics.length, 1);
  assert.equal(report.diagnostics[0].ruleId, "lynx-css/conditional-support");
  assert.match(report.diagnostics[0].message, /targetSdkVersion 3.1/);
});

test("CSS keyword features are checked and null compatibility remains unknown", async (t) => {
  const root = createProject(t);
  configure(root, { android: "2.0" });
  writeFile(root, "src/app.css", ".card { display: grid; position: static; }");
  const report = await scanProject({ directory: root });
  assert.deepEqual(report.diagnostics.map((d) => d.ruleId), ["lynx-css/requires-newer-version", "lynx-css/unsupported"]);
  configure(root, { web_lynx: "3.7" });
  writeFile(root, "src/app.css", ".card { -x-animation-color-interpolation: sRGB; }");
  const unknown = await scanProject({ directory: root });
  assert.deepEqual(unknown.diagnostics, []);
  assert.equal(unknown.cssCoverage.unknownComparisons, 1);
});

test("CSS without engine targets reports skipped coverage without guessing npm versions", async (t) => {
  const root = createProject(t);
  writeFile(root, "src/app.css", ".card { filter: brightness(0.5); }");
  const report = await scanProject({ directory: root });
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.cssCoverage.status, "not-configured");
  assert.match(formatReport(report), /CSS compatibility was not checked/);
  configure(root, { android: "3.5" }, { categories: { "lynx-css": "off" } });
  assert.equal((await scanProject({ directory: root })).cssCoverage.status, "disabled");
});

test("CSS custom properties, strings, and descriptors do not masquerade as features", async (t) => {
  const root = createProject(t);
  configure(root, { android: "3.5" });
  writeFile(root, "src/app.css", `
@font-face { font-family: "brightness"; src: url("brightness(0.5)"); }
.card { --filter: brightness(0.5); filter: var(--filter); content: "brightness(0.5)"; }
`);
  const report = await scanProject({ directory: root });
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.cssCoverage.declarations, 2);
});

test("CSS respects staged contents, ignores, rule overrides, and selected categories", async (t) => {
  const root = createProject(t);
  configure(root, { android: "3.5" }, {
    ignore: { files: ["generated/**"] }, rules: { "lynx-css/requires-newer-version": "warning" }
  });
  initGit(root); commit(root);
  writeFile(root, "src/app.css", ".card { filter: brightness(0.5); }");
  writeFile(root, "generated/app.css", ".card { filter: brightness(0.5); }");
  git(root, "add", ".");
  writeFile(root, "src/app.css", ".card { filter: blur(2px); }");
  const report = await scanProject({ directory: root, staged: true });
  assert.equal(report.diagnostics.length, 1);
  assert.equal(report.diagnostics[0].severity, "warning");
  assert.deepEqual(report.scannedFiles, ["src/app.css"]);
  assert.deepEqual((await scanProject({ directory: root, categories: ["reactlynx"] })).diagnostics, []);
});

test("invalid CSS targets fail explicitly and malformed CSS is reported", async (t) => {
  const root = createProject(t);
  configure(root, { andriod: "3.5" });
  await assert.rejects(() => scanProject({ directory: root }), /Unknown CSS target andriod/);
  configure(root, { android: "latest" });
  await assert.rejects(() => scanProject({ directory: root }), /numeric Lynx engine version/);
  configure(root, { android: "3.5" });
  writeFile(root, "src/app.css", ".card { filter: brightness(0.5);");
  const report = await scanProject({ directory: root });
  assert.equal(report.ok, false);
  assert.deepEqual(report.parseErrors, [{ filePath: "src/app.css", line: 1, column: 1, message: "Unclosed block" }]);
  assert.equal(report.cssCoverage.files, 0);
});
