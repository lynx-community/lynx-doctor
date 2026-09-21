import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import picomatch from "picomatch";
import ts from "typescript";
import { analyzeSource, checkThreadSyntax, type SourceAnalysis } from "./syntax.js";
import { readCompilerOptions } from "./typescript-config.js";
import { RULE_BY_ID } from "../rules/catalog.js";
import { resolveConfig } from "./config.js";
import { DEFAULT_IGNORE_PATTERNS, discoverProject } from "./project.js";
import { listChangedFiles, readWorkingFile, toPosixRelativePath, type SourceSelection } from "./git.js";
import type {
  BlockingLevel,
  Category,
  Diagnostic,
  LynxDoctorConfig,
  ProjectInfo,
  RuleDefinition,
  ScanOptions,
  ScanReport,
  Severity
} from "./types.js";

const SOURCE_GLOBS = ["**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"];
const DEFAULT_BLOCKING: BlockingLevel = "error";
const LYNX_UI_GESTURE_COMPONENTS = ["Draggable", "Sheet", "Slider", "Sortable", "SwipeAction", "Swiper"];

interface MutableDiagnosticInput {
  readonly ruleId: string;
  readonly filePath: string;
  readonly line: number;
  readonly column?: number;
  readonly message: string;
  readonly sourceLine?: string;
}

interface FileContext {
  readonly rootDirectory: string;
  readonly filePath: string;
  readonly relativePath: string;
  readonly content: string;
  readonly lines: readonly string[];
  readonly hasGlobalPropsEventMode: boolean;
  readonly hasNewGestureEnabled: boolean;
}

const getRule = (ruleId: string): RuleDefinition => {
  const rule = RULE_BY_ID.get(ruleId);
  if (!rule) throw new Error(`Unknown Lynx Doctor rule: ${ruleId}`);
  return rule;
};

const normalizeCategory = (category: string): string => category.toLowerCase().replace(/\s+/g, "-");

const addDiagnostic = (diagnostics: Diagnostic[], input: MutableDiagnosticInput): void => {
  const rule = getRule(input.ruleId);
  diagnostics.push({
    ruleId: rule.id,
    title: rule.title,
    category: rule.category,
    subcategory: rule.subcategory,
    severity: rule.defaultSeverity,
    message: input.message,
    help: rule.fix,
    filePath: input.filePath,
    line: input.line,
    column: input.column ?? 1,
    ...(input.sourceLine ? { sourceLine: input.sourceLine.trimEnd() } : {}),
    docsUrl: rule.docsUrl,
    source: rule.source,
    tags: rule.tags
  });
};

const findColumn = (line: string, pattern: RegExp): number => {
  const match = pattern.exec(line);
  pattern.lastIndex = 0;
  return match ? match.index + 1 : 1;
};

const checkGlobalPropsEventMode = (context: FileContext, diagnostics: Diagnostic[]): void => {
  if (!context.hasGlobalPropsEventMode) return;
  if (!context.content.includes("lynx.__globalProps")) return;
  if (context.content.includes("useGlobalPropsChanged")) return;
  const index = context.lines.findIndex((line) => line.includes("lynx.__globalProps"));
  const line = context.lines[index] ?? "";
  addDiagnostic(diagnostics, {
    ruleId: "reactlynx/global-props-event-mode",
    filePath: context.relativePath,
    line: index + 1,
    column: Math.max(1, line.indexOf("lynx.__globalProps") + 1),
    sourceLine: line,
    message:
      "globalPropsMode is event, but this file reads lynx.__globalProps directly without subscribing to changes."
  });
};

const checkLazyWithoutSuspense = (context: FileContext, diagnostics: Diagnostic[]): void => {
  if (!/\blazy\s*\(/.test(context.content)) return;
  if (/\bSuspense\b/.test(context.content)) return;
  const index = context.lines.findIndex((line) => /\blazy\s*\(/.test(line));
  const line = context.lines[index] ?? "";
  addDiagnostic(diagnostics, {
    ruleId: "reactlynx/lazy-without-suspense",
    filePath: context.relativePath,
    line: index + 1,
    column: Math.max(1, line.search(/\blazy\s*\(/) + 1),
    sourceLine: line,
    message:
      "This file defines a lazy component but does not contain a Suspense boundary for its loading state."
  });
};

const checkLynxUiAggregateImports = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const packagePattern = /["'](@lynx-js\/lynx-ui-[^"']+)["']/g;
  context.lines.forEach((line, index) => {
    for (const match of line.matchAll(packagePattern)) {
      const packageName = match[1];
      if (!packageName) continue;
      addDiagnostic(diagnostics, {
        ruleId: "lynx-ui/prefer-public-aggregate-import",
        filePath: context.relativePath,
        line: index + 1,
        column: (match.index ?? 0) + 2,
        sourceLine: line,
        message: `This file imports ${packageName} directly instead of using the public @lynx-js/lynx-ui entry.`
      });
    }
  });
};

const importsLynxUiButton = (content: string): boolean =>
  /import\s*{[^}]*\bButton\b[^}]*}\s*from\s*["']@lynx-js\/lynx-ui["']/.test(content) ||
  /from\s*["']@lynx-js\/lynx-ui-button["']/.test(content);

const checkLynxUiButtonHandlers = (context: FileContext, diagnostics: Diagnostic[]): void => {
  if (!importsLynxUiButton(context.content)) return;
  const nativeHandlerPattern = /<Button\b[^>]*\b(?:bind|catch)[\w-]*\s*=/g;
  context.lines.forEach((line, index) => {
    if (!nativeHandlerPattern.test(line)) return;
    nativeHandlerPattern.lastIndex = 0;
    addDiagnostic(diagnostics, {
      ruleId: "lynx-ui/button-uses-on-click",
      filePath: context.relativePath,
      line: index + 1,
      column: findColumn(line, nativeHandlerPattern),
      sourceLine: line,
      message: "This lynx-ui Button uses a native event attribute; the documented Button API exposes onClick."
    });
  });
};

const findLynxUiGestureImport = (lines: readonly string[]): { line: string; index: number; component: string } | null => {
  const aggregateImportPattern = /import\s*{([^}]+)}\s*from\s*["']@lynx-js\/lynx-ui["']/;
  const packageImportPattern = /@lynx-js\/lynx-ui-(draggable|sheet|slider|sortable|swipe-action|swiper)\b/;
  for (const [index, line] of lines.entries()) {
    const aggregateImport = aggregateImportPattern.exec(line);
    if (aggregateImport) {
      const importedNames = aggregateImport[1] ?? "";
      const component = LYNX_UI_GESTURE_COMPONENTS.find((name) =>
        new RegExp(`\\b${name}\\b`).test(importedNames),
      );
      if (component) return { line, index, component };
    }
    const packageImport = packageImportPattern.exec(line);
    if (packageImport) {
      return { line, index, component: packageImport[1] ?? "gesture component" };
    }
  }
  return null;
};

const checkLynxUiGestureConfig = (context: FileContext, diagnostics: Diagnostic[]): void => {
  if (context.hasNewGestureEnabled) return;
  const gestureImport = findLynxUiGestureImport(context.lines);
  if (!gestureImport) return;
  addDiagnostic(diagnostics, {
    ruleId: "lynx-ui/gesture-components-enable-new-gesture",
    filePath: context.relativePath,
    line: gestureImport.index + 1,
    column: Math.max(1, gestureImport.line.indexOf(gestureImport.component) + 1),
    sourceLine: gestureImport.line,
    message: `This file imports ${gestureImport.component}, but the project config does not enable ReactLynx's new gesture system.`
  });
};

const checkRspeedyExportStarBarrels = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const pattern = /^\s*export\s+\*\s+from\s+["'][^"']+["']/;
  context.lines.forEach((line, index) => {
    if (!pattern.test(line)) return;
    addDiagnostic(diagnostics, {
      ruleId: "rspeedy/no-export-star-barrels",
      filePath: context.relativePath,
      line: index + 1,
      column: Math.max(1, line.search(/export\s+\*/) + 1),
      sourceLine: line,
      message:
        "This export-star barrel can keep extra modules reachable and make rspeedy bundle tree-shaking less predictable."
    });
  });
};

const checkRspeedyEval = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const pattern = /\beval\s*\(/g;
  context.lines.forEach((line, index) => {
    if (!pattern.test(line)) return;
    pattern.lastIndex = 0;
    addDiagnostic(diagnostics, {
      ruleId: "rspeedy/no-eval-in-bundle-code",
      filePath: context.relativePath,
      line: index + 1,
      column: findColumn(line, pattern),
      sourceLine: line,
      message:
        "eval() can poison production name mangling and leave readable module-prefixed names in rspeedy chunks."
    });
  });
};

const readTextIfExists = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
};

const findLine = (content: string, pattern: RegExp): number => {
  const lines = content.split(/\r?\n/g);
  const index = lines.findIndex((line) => pattern.test(line));
  return index === -1 ? 1 : index + 1;
};

const checkProjectConfiguration = (project: ProjectInfo, diagnostics: Diagnostic[]): void => {
  if (!project.hasReactLynx) return;
  const packageJsonPath = path.join(project.rootDirectory, "package.json");
  if (!project.hasLynxTypes) {
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/types-package-missing",
      filePath: "package.json",
      line: 1,
      message:
        "This Lynx project does not declare @lynx-js/types, so Lynx globals and event types may be incomplete."
    });
  }

  const tsconfigPath = path.join(project.rootDirectory, "tsconfig.json");
  const tsconfig = readTextIfExists(tsconfigPath);
  if (!tsconfig) return;

  const compilerOptions = readCompilerOptions(tsconfigPath);
  const automaticJsx = compilerOptions.jsx === ts.JsxEmit.ReactJSX || compilerOptions.jsx === ts.JsxEmit.ReactJSXDev;
  if (compilerOptions.jsx !== ts.JsxEmit.Preserve && (!automaticJsx || compilerOptions.jsxImportSource !== "@lynx-js/react")) {
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/typescript-jsx-import-source",
      filePath: "tsconfig.json",
      line: findLine(tsconfig, /jsxImportSource|compilerOptions/),
      message:
        "The effective TypeScript configuration must preserve JSX or use react-jsx/react-jsxdev with jsxImportSource @lynx-js/react."
    });
  }

  if (!compilerOptions.isolatedModules && !compilerOptions.verbatimModuleSyntax) {
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/typescript-jsx-import-source",
      filePath: "tsconfig.json",
      line: findLine(tsconfig, /isolatedModules|compilerOptions/),
      message:
        "tsconfig.json does not enable isolatedModules, which Rspeedy/SWC projects should keep on."
    });
  }

  if (!fs.existsSync(packageJsonPath)) {
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/types-package-missing",
      filePath: "package.json",
      line: 1,
      message: "No package.json was found for dependency detection."
    });
  }
};

const hasGlobalPropsEventMode = (project: ProjectInfo): boolean =>
  project.configFiles.some((filePath) => {
    const content = readTextIfExists(filePath);
    return content !== null && /globalPropsMode\s*:\s*["']event["']/.test(content);
  });

const hasNewGestureEnabled = (project: ProjectInfo): boolean =>
  project.configFiles.some((filePath) => {
    const content = readTextIfExists(filePath);
    return content !== null && /enableNewGesture\s*:\s*true/.test(content);
  });

const isLynxSourceContext = (project: ProjectInfo, analysis: SourceAnalysis): boolean => {
  const modules = analysis.imports.map(analysis.moduleName);
  if (modules.some((name) => name.startsWith("@lynx-js/"))) return true;
  // Explicit React DOM imports or JSX pragmas take precedence over package-level detection.
  if (modules.some((name) => name === "react" || name === "react-dom" || name.startsWith("react-dom/")) ||
    /@jsxImportSource\s+react(?:\s|\*)/.test(analysis.file.text)) return false;
  return project.hasReactLynx || project.hasRspeedy || project.hasLynxUi;
};

const shouldBlock = (diagnostics: readonly Diagnostic[], blocking: BlockingLevel): boolean => {
  if (blocking === "none") return false;
  if (blocking === "warning") return diagnostics.length > 0;
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
};

const scoreDiagnostics = (diagnostics: readonly Diagnostic[]): number => {
  const penalty = diagnostics.reduce(
    (sum, diagnostic) => sum + (diagnostic.severity === "error" ? 12 : 5),
    0,
  );
  return Math.max(0, 100 - penalty);
};

const applyConfigToDiagnostic = (
  diagnostic: Diagnostic,
  config: LynxDoctorConfig,
): Diagnostic | null => {
  const ruleOverride = config.rules?.[diagnostic.ruleId];
  if (ruleOverride === "off") return null;
  const categoryOverride = config.categories?.[diagnostic.category];
  if (categoryOverride === "off") return null;
  const severity = (ruleOverride ?? categoryOverride ?? diagnostic.severity) as Severity;
  return severity === diagnostic.severity ? diagnostic : { ...diagnostic, severity };
};

const isCategorySelected = (diagnostic: Diagnostic, categories: readonly string[] | undefined): boolean => {
  if (!categories || categories.length === 0) return true;
  const selected = new Set(categories.map(normalizeCategory));
  return selected.has(normalizeCategory(diagnostic.category));
};

const listSourceFiles = async (
  rootDirectory: string,
  options: ScanOptions,
  config: LynxDoctorConfig,
): Promise<SourceSelection> => {
  const ignore = [...DEFAULT_IGNORE_PATTERNS, ...(config.ignore?.files ?? [])];
  const changedFiles = listChangedFiles(rootDirectory, options);
  if (changedFiles !== null) {
    const isSource = picomatch(SOURCE_GLOBS);
    const isIgnored = picomatch(ignore, { dot: true });
    return {
      files: changedFiles.files.filter((filePath) => {
        const relative = toPosixRelativePath(rootDirectory, filePath);
        return isSource(relative) && !isIgnored(relative);
      }),
      readFile: changedFiles.readFile
    };
  }

  const files = await fg(SOURCE_GLOBS, {
    cwd: rootDirectory,
    absolute: true,
    onlyFiles: true,
    ignore
  });
  return { files: files.sort(), readFile: readWorkingFile };
};

export const scanProject = async (options: ScanOptions = {}): Promise<ScanReport> => {
  const startedAt = Date.now();
  const rootDirectory = path.resolve(options.directory ?? ".");
  const project = await discoverProject(rootDirectory);
  const resolvedConfig = await resolveConfig(project.rootDirectory);
  const selection = await listSourceFiles(project.rootDirectory, options, resolvedConfig.config);
  const scannedFiles: string[] = [];
  const diagnostics: Diagnostic[] = [];
  const eventMode = hasGlobalPropsEventMode(project);
  const newGestureEnabled = hasNewGestureEnabled(project);

  checkProjectConfiguration(project, diagnostics);

  for (const filePath of selection.files) {
    const content = selection.readFile(filePath);
    if (content === null) continue;
    scannedFiles.push(filePath);
    const context: FileContext = {
      rootDirectory: project.rootDirectory,
      filePath,
      relativePath: toPosixRelativePath(project.rootDirectory, filePath),
      content,
      lines: content.split(/\r?\n/g),
      hasGlobalPropsEventMode: eventMode,
      hasNewGestureEnabled: newGestureEnabled
    };
    const analysis = analyzeSource(filePath, content);
    if (!isLynxSourceContext(project, analysis)) continue;
    for (const finding of checkThreadSyntax(analysis)) {
      const position = analysis.file.getLineAndCharacterOfPosition(finding.node.getStart(analysis.file));
      addDiagnostic(diagnostics, {
        ruleId: finding.ruleId,
        message: finding.message,
        filePath: context.relativePath,
        line: position.line + 1,
        column: position.character + 1,
        sourceLine: context.lines[position.line] ?? ""
      });
    }
    checkGlobalPropsEventMode(context, diagnostics);
    checkLazyWithoutSuspense(context, diagnostics);
    checkLynxUiAggregateImports(context, diagnostics);
    checkLynxUiButtonHandlers(context, diagnostics);
    checkLynxUiGestureConfig(context, diagnostics);
    if (project.hasRspeedy) {
      checkRspeedyExportStarBarrels(context, diagnostics);
      checkRspeedyEval(context, diagnostics);
    }
  }

  const filteredDiagnostics = diagnostics
    .map((diagnostic) => applyConfigToDiagnostic(diagnostic, resolvedConfig.config))
    .filter((diagnostic): diagnostic is Diagnostic => diagnostic !== null)
    .filter((diagnostic) => (options.includeWarnings === false ? diagnostic.severity === "error" : true))
    .filter((diagnostic) => isCategorySelected(diagnostic, options.categories));

  const affectedFiles = new Set(filteredDiagnostics.map((diagnostic) => diagnostic.filePath));
  const affectedRules = new Set(filteredDiagnostics.map((diagnostic) => diagnostic.ruleId));
  const blocking = options.blocking ?? DEFAULT_BLOCKING;

  return {
    ok: !shouldBlock(filteredDiagnostics, blocking),
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    project,
    configPath: resolvedConfig.path,
    scannedFiles: scannedFiles.map((filePath) => toPosixRelativePath(project.rootDirectory, filePath)),
    diagnostics: filteredDiagnostics,
    score: scoreDiagnostics(filteredDiagnostics),
    summary: {
      errorCount: filteredDiagnostics.filter((diagnostic) => diagnostic.severity === "error").length,
      warningCount: filteredDiagnostics.filter((diagnostic) => diagnostic.severity === "warning").length,
      fileCount: affectedFiles.size,
      ruleCount: affectedRules.size
    },
    blocking
  };
};
