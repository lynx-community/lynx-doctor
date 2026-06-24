import { spawn } from "node:child_process";
import type { Diagnostic, ScanReport } from "./types.js";

const MAX_PROMPT_GROUPS = 5;
const MAX_FILES_PER_GROUP = 5;

const groupByRule = (diagnostics: readonly Diagnostic[]): [string, Diagnostic[]][] => {
  const groups = new Map<string, Diagnostic[]>();
  for (const diagnostic of diagnostics) {
    const group = groups.get(diagnostic.ruleId);
    if (group) group.push(diagnostic);
    else groups.set(diagnostic.ruleId, [diagnostic]);
  }
  return [...groups.entries()].sort((a, b) => {
    const severityA = a[1].some((diagnostic) => diagnostic.severity === "error") ? 0 : 1;
    const severityB = b[1].some((diagnostic) => diagnostic.severity === "error") ? 0 : 1;
    if (severityA !== severityB) return severityA - severityB;
    return b[1].length - a[1].length;
  });
};

export const buildAgentPrompt = (report: ScanReport): string => {
  const groups = groupByRule(report.diagnostics).slice(0, MAX_PROMPT_GROUPS);
  const lines: string[] = [
    `Fix the top ${groups.length} Lynx Doctor ${groups.length === 1 ? "issue" : "issues"} in ${report.project.projectName}.`,
    "",
    "Work like this:",
    "1. Read the reported files before editing.",
    "2. Fix the root cause; do not silence rules unless the code truly cannot change.",
    "3. Re-run `npx lynx-doctor@latest --verbose` and confirm the finding is gone.",
    "4. Explain what changed and why it matters for Lynx.",
    ""
  ];

  groups.forEach(([ruleId, diagnostics], index) => {
    const first = diagnostics[0];
    if (!first) return;
    lines.push(`${index + 1}. ${first.severity.toUpperCase()} ${ruleId}: ${first.title}`);
    lines.push(`   Category: ${first.category}/${first.subcategory}`);
    lines.push(`   ${first.message}`);
    lines.push(`   Fix recipe: ${first.help}`);
    lines.push(`   Docs: ${first.docsUrl}`);
    lines.push(`   Source skill: ${first.source.skill}/${first.source.docsPath}`);
    const seenFiles = new Set<string>();
    for (const diagnostic of diagnostics) {
      if (seenFiles.has(diagnostic.filePath)) continue;
      seenFiles.add(diagnostic.filePath);
      lines.push(`   - ${diagnostic.filePath}:${diagnostic.line}`);
      if (seenFiles.size >= MAX_FILES_PER_GROUP) break;
    }
    const remaining = new Set(diagnostics.map((diagnostic) => diagnostic.filePath)).size - seenFiles.size;
    if (remaining > 0) lines.push(`   - +${remaining} more files`);
    lines.push("");
  });

  lines.push(
    `Current score: ${report.score}/100. Current counts: ${report.summary.errorCount} errors, ${report.summary.warningCount} warnings.`,
  );
  return lines.join("\n");
};

const resolveAgentCommand = (agent: string): string => {
  if (agent === "codex") return "codex";
  if (agent === "claude") return "claude";
  if (agent === "cursor") return "cursor";
  return agent;
};

export const launchAgent = async (
  agent: string,
  prompt: string,
  cwd: string,
): Promise<number | null> =>
  new Promise((resolve, reject) => {
    const child = spawn(resolveAgentCommand(agent), [], {
      cwd,
      stdio: ["pipe", "inherit", "inherit"]
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
    child.stdin.end(prompt);
  });
