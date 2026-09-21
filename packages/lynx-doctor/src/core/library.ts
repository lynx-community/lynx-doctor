import fs from "node:fs";
import path from "node:path";
import type { ProjectInfo } from "./types.js";

interface Entry { readonly field: string; readonly target: string; readonly types: boolean }
interface LibraryFinding { readonly ruleId: string; readonly message: string; readonly line: number }
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const checkLibrary = (project: ProjectInfo, checkArtifacts: boolean) => {
  const findings: LibraryFinding[] = [];
  const notices: string[] = [];
  const filePath = path.join(project.rootDirectory, "package.json");
  if (!fs.existsSync(filePath)) return { findings, notices };
  const content = fs.readFileSync(filePath, "utf8");
  const pkg: unknown = JSON.parse(content);
  // Require both a ReactLynx peer contract and public entries; app dependencies are insufficient.
  if (!isRecord(pkg) || !isRecord(pkg.peerDependencies) || !pkg.peerDependencies["@lynx-js/react"] ||
    !(pkg.exports || pkg.main || pkg.module)) return { findings, notices };

  const entries: Entry[] = [];
  const walk = (value: unknown, field: string, types = false): void => {
    if (typeof value === "string") { entries.push({ field, target: value, types }); return; }
    if (Array.isArray(value)) {
      // A later array member may be a valid fallback; existence checks need resolver semantics.
      notices.push(`Library export ${field} uses fallbacks; inspect its packed consumer resolution manually.`);
      return;
    }
    if (!isRecord(value)) return;
    for (const [condition, target] of Object.entries(value)) {
      if (condition.startsWith(".") || ["import", "require", "default", "types"].includes(condition)) {
        walk(target, `${field}.${condition}`, types || condition === "types");
      }
      // Source/development/custom conditions are opt-in and not universal runtime entries.
    }
  };
  for (const field of ["main", "module", "types", "typings"] as const) {
    if (typeof pkg[field] === "string") entries.push({ field, target: pkg[field], types: field === "types" || field === "typings" });
  }
  walk(pkg.exports, "exports");
  const lineOf = (target: string): number => {
    const index = content.indexOf(JSON.stringify(target));
    return index < 0 ? 1 : content.slice(0, index).split(/\r?\n/).length;
  };
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(`${entry.types}:${entry.target}`)) continue;
    seen.add(`${entry.types}:${entry.target}`);
    if (!entry.types && /\.(?:tsx?|mts|cts)$/.test(entry.target)) {
      findings.push({ ruleId: "reactlynx/library-runtime-entry", line: lineOf(entry.target),
        message: `${entry.field} points at ${entry.target}. A universal ReactLynx library entry should expose type-erased output; keep TS/TSX behind an explicit source entry.` });
    }
    if (!checkArtifacts) continue;
    if (entry.target.includes("*")) {
      notices.push(`Library artifact pattern ${entry.target} was not expanded; verify every packed subpath separately.`);
      continue;
    }
    const resolved = path.resolve(project.rootDirectory, entry.target);
    const relative = path.relative(project.rootDirectory, resolved);
    const inside = relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
    let exists = false;
    if (inside) {
      try { exists = fs.statSync(resolved).isFile(); } catch (error) {
        if (!error || typeof error !== "object" || !("code" in error) || !["ENOENT", "ENOTDIR"].includes(String(error.code))) throw error;
      }
    }
    if (!exists) findings.push({ ruleId: "reactlynx/library-missing-artifact", line: lineOf(entry.target),
      message: `${entry.field} references ${entry.target}, but no file exists at that package-local path. Build the library and align its runtime/declaration entries with the actual output.` });
  }
  if (checkArtifacts) notices.push("Library checks inspect existing working-tree entry files. They do not run builds or verify npm tarball inclusion, JSX preservation, or consumer resolution.");
  return { findings, notices };
};
