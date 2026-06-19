import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { RULE_BY_ID } from "../rules/catalog.js";
import { resolveConfig } from "./config.js";
import { DEFAULT_IGNORE_PATTERNS, discoverProject } from "./project.js";
import { listChangedFiles, toPosixRelativePath } from "./git.js";
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
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
const DEFAULT_BLOCKING: BlockingLevel = "error";

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
    severity: rule.defaultSeverity,
    message: input.message,
    help: rule.fix,
    filePath: input.filePath,
    line: input.line,
    column: input.column ?? 1,
    ...(input.sourceLine ? { sourceLine: input.sourceLine.trimEnd() } : {}),
    docsUrl: rule.docsUrl,
    tags: rule.tags
  });
};

const lineHasDirective = (line: string, directive: "background only" | "main thread"): boolean =>
  line.includes(`'${directive}'`) || line.includes(`"${directive}"`);

const hasDirectiveNearby = (
  lines: readonly string[],
  lineIndex: number,
  directive: "background only" | "main thread",
): boolean => {
  const start = Math.max(0, lineIndex - 12);
  for (let index = lineIndex; index >= start; index--) {
    if (lineHasDirective(lines[index] ?? "", directive)) return true;
  }
  return false;
};

const isLikelyBackgroundContext = (lines: readonly string[], lineIndex: number): boolean => {
  if (hasDirectiveNearby(lines, lineIndex, "background only")) return true;
  const start = Math.max(0, lineIndex - 10);
  const context = lines.slice(start, lineIndex + 1).join("\n");
  return /\buseEffect\s*\(|\buseImperativeHandle\s*\(|\bref\s*=\s*{|\bbind[a-z-]*\s*=\s*{|\bcatch[a-z-]*\s*=\s*{/i.test(
    context,
  );
};

const findColumn = (line: string, pattern: RegExp): number => {
  const match = pattern.exec(line);
  pattern.lastIndex = 0;
  return match ? match.index + 1 : 1;
};

const checkBackgroundOnlyApi = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const pattern = /\b(?:lynx\.getJSModule|NativeModules)\b/g;
  context.lines.forEach((line, index) => {
    if (!pattern.test(line)) return;
    pattern.lastIndex = 0;
    if (isLikelyBackgroundContext(context.lines, index)) return;
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/background-only-api",
      filePath: context.relativePath,
      line: index + 1,
      column: findColumn(line, pattern),
      sourceLine: line,
      message:
        "This native API call is not inside an obvious background-only context, so it may run during main-thread render."
    });
  });
};

const checkUseLayoutEffect = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const pattern = /\buseLayoutEffect\b/g;
  context.lines.forEach((line, index) => {
    if (!pattern.test(line)) return;
    pattern.lastIndex = 0;
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/avoid-use-layout-effect",
      filePath: context.relativePath,
      line: index + 1,
      column: findColumn(line, pattern),
      sourceLine: line,
      message:
        "ReactLynx does not support React DOM style synchronous layout effects; this lifecycle can give a false sense of safety."
    });
  });
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const functionHasDirective = (
  content: string,
  functionName: string,
  directive: "main thread" | "background only",
): boolean => {
  const escaped = escapeRegExp(functionName);
  const patterns = [
    new RegExp(`function\\s+${escaped}\\s*\\([^)]*\\)\\s*{([\\s\\S]{0,240})`, "m"),
    new RegExp(`(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[^=()]+)\\s*=>\\s*{([\\s\\S]{0,240})`, "m")
  ];
  for (const pattern of patterns) {
    const bodyStart = pattern.exec(content)?.[1];
    if (!bodyStart) continue;
    const firstStatements = bodyStart
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("//"))
      .slice(0, 3)
      .join("\n");
    if (lineHasDirective(firstStatements, directive)) return true;
  }
  return false;
};

const checkMainThreadHandlers = (context: FileContext, diagnostics: Diagnostic[]): void => {
  const attributePattern = /main-thread:[\w-]+\s*=\s*{([^}]+)}/g;
  context.lines.forEach((line, index) => {
    for (const match of line.matchAll(attributePattern)) {
      const expression = match[1]?.trim() ?? "";
      const handlerName = /^[A-Za-z_$][\w$]*$/.test(expression) ? expression : null;
      const hasDirective =
        handlerName !== null
          ? functionHasDirective(context.content, handlerName, "main thread")
          : lineHasDirective(expression, "main thread");
      if (hasDirective) continue;
      addDiagnostic(diagnostics, {
        ruleId: "reactlynx/main-thread-handler-directive",
        filePath: context.relativePath,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        sourceLine: line,
        message:
          handlerName === null
            ? "This inline main-thread handler does not show a 'main thread' directive."
            : `main-thread handler "${handlerName}" is missing a top-level 'main thread' directive.`
      });
    }
  });
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
        "This ReactLynx project does not declare @lynx-js/types, so Lynx globals and event types may be incomplete."
    });
  }

  const tsconfigPath = path.join(project.rootDirectory, "tsconfig.json");
  const tsconfig = readTextIfExists(tsconfigPath);
  if (!tsconfig) return;

  if (!/"jsxImportSource"\s*:\s*"@lynx-js\/react"/.test(tsconfig)) {
    addDiagnostic(diagnostics, {
      ruleId: "reactlynx/typescript-jsx-import-source",
      filePath: "tsconfig.json",
      line: findLine(tsconfig, /jsxImportSource|compilerOptions/),
      message:
        "tsconfig.json does not set compilerOptions.jsxImportSource to @lynx-js/react."
    });
  }

  if (!/"isolatedModules"\s*:\s*true/.test(tsconfig)) {
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

const isLynxSourceContext = (project: ProjectInfo, content: string): boolean =>
  project.hasReactLynx ||
  project.hasRspeedy ||
  /from\s+["']@lynx-js\//.test(content) ||
  /import\s+["']@lynx-js\//.test(content);

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
): Promise<string[]> => {
  const ignore = [...DEFAULT_IGNORE_PATTERNS, ...(config.ignore?.files ?? [])];
  const changedFiles = listChangedFiles(rootDirectory, options);
  if (changedFiles !== null) {
    return changedFiles
      .filter((filePath) => SOURCE_EXTENSIONS.has(path.extname(filePath)))
      .map((filePath) => path.resolve(rootDirectory, filePath))
      .filter((filePath) => fs.existsSync(filePath));
  }

  const files = await fg(SOURCE_GLOBS, {
    cwd: rootDirectory,
    absolute: true,
    onlyFiles: true,
    ignore
  });
  return files.sort();
};

export const scanProject = async (options: ScanOptions = {}): Promise<ScanReport> => {
  const startedAt = Date.now();
  const rootDirectory = path.resolve(options.directory ?? ".");
  const project = await discoverProject(rootDirectory);
  const resolvedConfig = await resolveConfig(project.rootDirectory);
  const scannedFiles = await listSourceFiles(project.rootDirectory, options, resolvedConfig.config);
  const diagnostics: Diagnostic[] = [];
  const eventMode = hasGlobalPropsEventMode(project);

  checkProjectConfiguration(project, diagnostics);

  for (const filePath of scannedFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const context: FileContext = {
      rootDirectory: project.rootDirectory,
      filePath,
      relativePath: toPosixRelativePath(project.rootDirectory, filePath),
      content,
      lines: content.split(/\r?\n/g),
      hasGlobalPropsEventMode: eventMode
    };
    if (!isLynxSourceContext(project, content)) continue;
    checkBackgroundOnlyApi(context, diagnostics);
    checkUseLayoutEffect(context, diagnostics);
    checkMainThreadHandlers(context, diagnostics);
    checkGlobalPropsEventMode(context, diagnostics);
    checkLazyWithoutSuspense(context, diagnostics);
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
