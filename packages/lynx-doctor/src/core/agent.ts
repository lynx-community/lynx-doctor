import { spawn } from "node:child_process";
import { VERSION, type Diagnostic, type ScanReport } from "./types.js";

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
  const parseErrors = report.parseErrors ?? [];
  const parseGroupCount = parseErrors.length > 0 ? 1 : 0;
  const issueCount = groups.length + parseGroupCount;
  const lines: string[] = [
    `Fix the top ${issueCount} Lynx Doctor ${issueCount === 1 ? "issue" : "issues"} in ${report.project.projectName}.`,
    "",
    "Work like this:",
    "1. Read the reported files before editing.",
    "2. Fix the root cause; do not silence rules unless the code truly cannot change.",
    `3. Re-run \`npx --yes lynx-doctor@${VERSION} --verbose\` and confirm the finding is gone. Doctor will also verify after the handoff.`,
    "4. Explain what changed and why it matters for Lynx.",
    ""
  ];

  if (parseErrors.length > 0) {
    lines.push("1. ERROR source parsing: some files could not be checked.");
    lines.push("   Inspect the reported code and resolve the parse errors, then re-run Doctor to complete the scan.");
    for (const error of parseErrors.slice(0, MAX_FILES_PER_GROUP)) {
      lines.push(`   - ${error.filePath}:${error.line}:${error.column}: ${error.message}`);
    }
    if (parseErrors.length > MAX_FILES_PER_GROUP) lines.push(`   - +${parseErrors.length - MAX_FILES_PER_GROUP} more files`);
    lines.push("");
  }

  groups.forEach(([ruleId, diagnostics], index) => {
    const first = diagnostics[0];
    if (!first) return;
    lines.push(`${index + 1 + parseGroupCount}. ${first.severity.toUpperCase()} ${ruleId}: ${first.title}`);
    lines.push(`   Category: ${first.category}/${first.subcategory}`);
    lines.push(`   ${first.message}`);
    lines.push(`   Fix recipe: ${first.help}`);
    lines.push(`   Docs: ${first.docsUrl}`);
    lines.push(`   Source skill: ${first.source.skill}/${first.source.docsPath} @ ${first.source.ref}`);
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
    `${parseErrors.length ? "Score unavailable: scan incomplete." : `Current score: ${report.score}/100.`} Current rule counts: ${report.summary.errorCount} errors, ${report.summary.warningCount} warnings.`,
  );
  return lines.join("\n");
};

type ResolvedAgentCommand = {
  readonly command: string;
  readonly args: readonly string[];
};

const resolveAgentCommand = (agent: string): ResolvedAgentCommand => {
  if (agent === "codex") return { command: "codex", args: ["exec", "-"] };
  if (agent === "claude") return { command: "claude", args: ["-p"] };
  if (agent === "cursor") return { command: "cursor", args: [] };
  return { command: agent, args: [] };
};

const formatAgentCommand = ({ command, args }: ResolvedAgentCommand): string =>
  [command, ...args].join(" ");

export const launchAgent = async (
  agent: string,
  prompt: string,
  cwd: string,
): Promise<number | null> =>
  new Promise((resolve, reject) => {
    const resolvedAgent = resolveAgentCommand(agent);
    const command = process.platform === "win32" ? `"${resolvedAgent.command}"` : resolvedAgent.command;
    const child = spawn(command, resolvedAgent.args, {
      cwd,
      shell: process.platform === "win32",
      stdio: ["pipe", "inherit", "inherit"]
    });
    child.on("error", reject);
    child.stdin.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve(code);
        return;
      }
      const reason = code === null ? `terminated by signal ${signal ?? "unknown"}` : `exited with code ${code}`;
      reject(new Error(`${formatAgentCommand(resolvedAgent)} ${reason}`));
    });
    child.stdin.end(prompt);
  });
