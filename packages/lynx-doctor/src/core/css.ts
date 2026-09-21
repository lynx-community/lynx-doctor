import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import postcss from "postcss";
import parseValue from "postcss-value-parser";
import type { CssTargets } from "./types.js";

export const CSS_DATA_VERSION = "0.0.16";
interface Support {
  readonly version_added: string | boolean | null;
  readonly partial_implementation?: boolean;
  readonly notes?: string | readonly string[];
}
interface Compat {
  readonly support: Readonly<Record<string, Support>>;
}
interface Feature {
  readonly __compat: Compat;
  readonly [key: string]: Feature | Compat;
}
interface Definition {
  readonly name: string;
  readonly compat_data?: Readonly<Record<string, Feature>> | null;
}
export interface CssFinding {
  readonly ruleId: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

let definitions: Map<string, Definition> | undefined;
const readDefinitions = (): Map<string, Definition> => {
  if (definitions) return definitions;
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve("@lynx-js/css-defines/package.json");
  const metadata = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version: string };
  if (metadata.version !== CSS_DATA_VERSION) throw new Error(`Expected @lynx-js/css-defines@${CSS_DATA_VERSION}, found ${metadata.version}. Reinstall dependencies.`);
  const directory = path.join(path.dirname(packagePath), "css_defines");
  definitions = new Map(fs.readdirSync(directory).filter((name) => name.endsWith(".json")).map((name) => {
    const definition = JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as Definition;
    return [definition.name, definition];
  }));
  return definitions;
};

const olderThan = (target: string, minimum: string): boolean => {
  const left = target.split(".").map(Number);
  const right = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((left[i] ?? 0) !== (right[i] ?? 0)) return (left[i] ?? 0) < (right[i] ?? 0);
  }
  return false;
};

const valueFeatures = (feature: Feature, value: string): string[] => {
  const nodes = parseValue(value).nodes.filter((node) => node.type !== "space" && node.type !== "comment");
  const tokens = nodes.flatMap((node) => node.type === "function" ? [node.value, `${node.value}()`] :
    nodes.length === 1 && node.type === "word" ? [node.value] : []);
  // Match published keys only. Grouped/semantic feature names are deliberately not guessed.
  return Object.keys(feature).filter((key) => key !== "__compat" && tokens.some((token) => token.toLowerCase() === key.toLowerCase()));
};

export const checkCss = (filePath: string, content: string, targets: CssTargets) => {
  const root = postcss.parse(content, { from: filePath });
  const data = readDefinitions();
  const findings: CssFinding[] = [];
  let declarations = 0;
  let unknownComparisons = 0;
  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    if (property.startsWith("--")) return;
    // @font-face/@property descriptors are not element style declarations.
    if (declaration.parent?.type === "atrule" && ["font-face", "property"].includes(declaration.parent.name.toLowerCase())) return;
    declarations++;
    const feature = data.get(property)?.compat_data?.[property];
    const selected: Array<[string, Compat | undefined]> = [[property, feature?.__compat]];
    if (feature) {
      for (const key of valueFeatures(feature, declaration.value)) {
        const child = feature[key];
        selected.push([`${property}.${key}`, child && "__compat" in child ? child.__compat : undefined]);
      }
    }
    for (const [backend, target] of Object.entries(targets)) {
      for (const [name, compat] of selected) {
        const support = compat?.support[backend];
        const added = support?.version_added;
        if (added === null || added === undefined) { unknownComparisons++; continue; }
        let ruleId: string | undefined;
        let reason: string | undefined;
        if (added === false) {
          ruleId = "lynx-css/unsupported";
          reason = "is explicitly unsupported";
        } else if (typeof added === "string" && /^\d+(?:\.\d+){0,2}$/.test(added) && olderThan(target, added)) {
          ruleId = "lynx-css/requires-newer-version";
          reason = `requires Lynx ${added} or newer`;
        } else if (typeof added === "string" && !/^\d+(?:\.\d+){0,2}$/.test(added)) {
          ruleId = "lynx-css/conditional-support";
          reason = `has a condition that the engine version cannot resolve: ${added}`;
        } else if (support?.partial_implementation) {
          ruleId = "lynx-css/conditional-support";
          reason = "has only partial support";
        }
        if (!ruleId) continue;
        const notes = Array.isArray(support?.notes) ? support.notes.join(" ") : support?.notes;
        findings.push({
          ruleId,
          line: declaration.source?.start?.line ?? 1,
          column: declaration.source?.start?.column ?? 1,
          message: `${name} ${reason} on ${backend} (target Lynx ${target}; @lynx-js/css-defines@${CSS_DATA_VERSION}).${notes ? ` ${notes}` : ""}`
        });
        // A failed base property already explains its value failures on this backend.
        if (name === property && ruleId !== "lynx-css/conditional-support") break;
      }
    }
  });
  return { findings, declarations, unknownComparisons };
};
