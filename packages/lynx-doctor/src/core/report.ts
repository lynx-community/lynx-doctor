import pc from "picocolors";
import type { Category, Diagnostic, ScanReport } from "./types.js";

export interface FormatReportOptions {
  readonly verbose?: boolean;
}

const scoreLabel = (score: number): string => {
  if (score >= 90) return "healthy";
  if (score >= 70) return "watch";
  if (score >= 50) return "risky";
  return "needs attention";
};

const colorByScore = (score: number, text: string): string => {
  if (score >= 90) return pc.green(text);
  if (score >= 70) return pc.cyan(text);
  if (score >= 50) return pc.yellow(text);
  return pc.red(text);
};

const colorSeverity = (diagnostic: Diagnostic, text: string): string =>
  diagnostic.severity === "error" ? pc.red(text) : pc.yellow(text);

const groupBy = <T, K extends string>(items: readonly T[], getKey: (item: T) => K): Map<K, T[]> => {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
};

const formatDuration = (milliseconds: number): string =>
  milliseconds < 1000 ? `${milliseconds}ms` : `${(milliseconds / 1000).toFixed(1)}s`;

const formatDiagnostic = (diagnostic: Diagnostic, verbose: boolean): string[] => {
  const location = `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`;
  const lines = [
    `  ${colorSeverity(diagnostic, diagnostic.severity.toUpperCase())} ${pc.bold(diagnostic.ruleId)} ${pc.dim(location)}`,
    `    ${diagnostic.category}/${diagnostic.subcategory}`,
    `    ${diagnostic.message}`,
    `    fix: ${diagnostic.help}`
  ];
  if (verbose && diagnostic.sourceLine) lines.push(pc.dim(`    > ${diagnostic.sourceLine.trim()}`));
  if (verbose) lines.push(pc.dim(`    docs: ${diagnostic.docsUrl}`));
  if (verbose) {
    lines.push(
      pc.dim(
        `    source: ${diagnostic.source.skill}/${diagnostic.source.docsPath} (${diagnostic.source.protocol})`,
      ),
    );
  }
  return lines;
};

export const formatReport = (report: ScanReport, options: FormatReportOptions = {}): string => {
  const lines: string[] = [];
  lines.push(pc.bold("Lynx Doctor"));
  lines.push(
    `${report.project.projectName} (${report.project.framework}) ${pc.dim(
      `${report.scannedFiles.length} files in ${formatDuration(report.durationMs)}`,
    )}`,
  );
  if (report.configPath) lines.push(pc.dim(`config: ${report.configPath}`));
  lines.push("");
  lines.push(
    `${colorByScore(report.score, `${report.score}/100`)} ${colorByScore(
      report.score,
      scoreLabel(report.score),
    )} ${pc.dim(
      `${report.summary.errorCount} errors, ${report.summary.warningCount} warnings across ${report.summary.fileCount} files`,
    )}`,
  );

  if (report.diagnostics.length === 0) {
    lines.push("");
    lines.push(pc.green("No Lynx Doctor findings."));
    return lines.join("\n");
  }

  lines.push("");
  const byCategory = groupBy(report.diagnostics, (diagnostic) => diagnostic.category);
  for (const [category, diagnostics] of byCategory.entries() as IterableIterator<[Category, Diagnostic[]]>) {
    const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
    const warningCount = diagnostics.length - errorCount;
    const subcategories = [...new Set(diagnostics.map((diagnostic) => diagnostic.subcategory))].join(", ");
    lines.push(
      `${pc.bold(category)} ${pc.dim("->")} ${errorCount ? pc.red(`${errorCount} errors`) : ""}${
        errorCount && warningCount ? pc.dim(", ") : ""
      }${warningCount ? pc.yellow(`${warningCount} warnings`) : ""}${pc.dim(` (${subcategories})`)}`,
    );
  }

  lines.push("");
  const limit = options.verbose ? report.diagnostics.length : Math.min(8, report.diagnostics.length);
  for (const diagnostic of report.diagnostics.slice(0, limit)) {
    lines.push(...formatDiagnostic(diagnostic, Boolean(options.verbose)));
  }
  const hiddenCount = report.diagnostics.length - limit;
  if (hiddenCount > 0) {
    lines.push("");
    lines.push(pc.dim(`Run with --verbose to show ${hiddenCount} more findings.`));
  }

  lines.push("");
  lines.push(
    report.ok
      ? pc.green(`Passes current blocking policy (${report.blocking}).`)
      : pc.red(`Fails current blocking policy (${report.blocking}).`),
  );
  lines.push(pc.dim("Use --agent-prompt to hand the top findings to a coding agent."));
  return lines.join("\n");
};

export const formatScore = (report: ScanReport): string => `${report.score}`;
