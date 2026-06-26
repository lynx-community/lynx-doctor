import { isCancel, select } from "@clack/prompts";
import { Command, Option } from "commander";
import pc from "picocolors";
import {
  buildAgentPrompt,
  CATEGORIES,
  formatReport,
  formatScore,
  installLynxDoctor,
  launchAgent,
  RULES,
  scanProject,
  VERSION,
  type BlockingLevel,
  type RuleDefinition,
  type Severity
} from "../index.js";

const collectCategory = (value: string, previous: string[] | undefined): string[] => [
  ...(previous ?? []),
  value
];

const parseDiff = (value: string | boolean | undefined): string | boolean | undefined => {
  if (value === undefined) return undefined;
  if (value === true) return true;
  if (value === "false") return false;
  return value;
};

const parseBlocking = (value: string | undefined): BlockingLevel => {
  if (value === "error" || value === "warning" || value === "none") return value;
  throw new Error("--blocking must be one of: error, warning, none");
};

const shouldOutputJson = (options: { readonly json?: boolean }, command: Command): boolean =>
  Boolean(options.json || command.optsWithGlobals<{ json?: boolean }>().json);

const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

const countRules = (rules: readonly RuleDefinition[], severity: Severity): number =>
  rules.filter((rule) => rule.defaultSeverity === severity).length;

const formatSeverity = (severity: Severity): string => {
  const label = severity.toUpperCase().padEnd("warning".length);
  return severity === "error" ? pc.red(label) : pc.yellow(label);
};

const formatSeveritySummary = (rules: readonly RuleDefinition[]): string => {
  const errorCount = countRules(rules, "error");
  const warningCount = countRules(rules, "warning");
  const parts = [
    errorCount > 0 ? pc.red(pluralize(errorCount, "error")) : "",
    warningCount > 0 ? pc.yellow(pluralize(warningCount, "warning")) : ""
  ].filter(Boolean);
  return parts.join(pc.dim(", "));
};

const wrapText = (text: string, width: number): string[] => {
  if (width <= 0 || text.length <= width) return [text];

  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (current.length === 0) {
      current = word;
    } else if (current.length + word.length + 1 <= width) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
};

const formatRulesList = (rules: readonly RuleDefinition[]): string => {
  const width = Math.max(48, Math.min(process.stdout.columns ?? 100, 120));
  const titleIndent = " ".repeat(12);
  const titleWidth = Math.max(24, width - titleIndent.length);
  const categoryGroups = CATEGORIES.map((category) => ({
    category,
    rules: rules.filter((rule) => rule.category === category)
  })).filter((group) => group.rules.length > 0);
  const lines: string[] = [];

  lines.push(pc.bold("Lynx Doctor rules"));
  lines.push(
    `${pluralize(rules.length, "rule")} across ${pluralize(
      categoryGroups.length,
      "category",
      "categories",
    )}: ${formatSeveritySummary(rules)}`,
  );

  for (const { category, rules: categoryRules } of categoryGroups) {
    lines.push("");
    lines.push(
      `${pc.cyan(pc.bold(category))} ${pc.dim(
        `(${pluralize(categoryRules.length, "rule")}: ${formatSeveritySummary(categoryRules)})`,
      )}`,
    );

    const subcategories = [...new Set(categoryRules.map((rule) => rule.subcategory))];
    for (const subcategory of subcategories) {
      const subcategoryRules = categoryRules.filter((rule) => rule.subcategory === subcategory);
      lines.push(`  ${pc.bold(subcategory)} ${pc.dim(`(${pluralize(subcategoryRules.length, "rule")})`)}`);
      for (const rule of subcategoryRules) {
        lines.push(`    ${formatSeverity(rule.defaultSeverity)} ${pc.bold(rule.id)}`);
        for (const titleLine of wrapText(rule.title, titleWidth)) {
          lines.push(`${titleIndent}${pc.dim(titleLine)}`);
        }
      }
    }
  }

  lines.push("");
  lines.push(pc.dim('Use "lynx-doctor rules explain <rule-id>" for details.'));
  return lines.join("\n");
};

type AgentSelection =
  | { readonly type: "agent"; readonly command: string }
  | { readonly type: "prompt" }
  | { readonly type: "skip" };

type AgentSelectionValue = "codex" | "claude" | "prompt" | "skip";

const canSelectAgentInteractively = (options: Record<string, unknown>): boolean =>
  options.agentSelect !== false &&
  !options.agent &&
  !options.agentPrompt &&
  !options.json &&
  !options.score &&
  Boolean(process.stdin.isTTY && process.stdout.isTTY);

const printAgentPrompt = (prompt: string): void => {
  process.stdout.write(`\n${pc.dim("---- Agent prompt ----")}\n${prompt}\n`);
};

const launchAgentOrPrintPrompt = async (agent: string, prompt: string, cwd: string): Promise<void> => {
  try {
    await launchAgent(agent, prompt, cwd);
  } catch (error) {
    process.stderr.write(
      `${pc.yellow("Could not launch agent; printing prompt instead.")}\n${String(error)}\n\n`,
    );
    process.stdout.write(`${prompt}\n`);
  }
};

const selectAgentInteractively = async (): Promise<AgentSelection> => {
  process.stdout.write("\n");
  const selection = await select<AgentSelectionValue>({
    message: "Hand off these findings?",
    initialValue: "codex",
    maxItems: 4,
    withGuide: true,
    options: [
      {
        label: "Codex",
        value: "codex",
        hint: "codex exec -"
      },
      {
        label: "Claude",
        value: "claude",
        hint: "claude -p"
      },
      {
        label: "Print prompt",
        value: "prompt",
        hint: "inspect first"
      },
      {
        label: "Skip",
        value: "skip",
        hint: "finish scan"
      }
    ]
  });

  if (isCancel(selection)) {
    return { type: "skip" };
  }
  if (selection === "codex" || selection === "claude") {
    return { type: "agent", command: selection };
  }
  if (selection === "prompt") return { type: "prompt" };
  return { type: "skip" };
};

const program = new Command()
  .name("lynx-doctor")
  .description("Scan Lynx projects, then hand focused fixes to coding agents")
  .version(VERSION, "-v, --version", "print the installed version")
  .argument("[directory]", "project directory to scan", ".")
  .option("--verbose", "show every finding with source context")
  .option("--json", "output a structured JSON report")
  .option("--json-compact", "with --json, emit compact JSON")
  .option("--score", "output only the numeric score")
  .option("--staged", "scan only staged files")
  .addOption(new Option("--diff [base]", "scan files changed against a base ref").default(false))
  .addOption(
    new Option("--category <category>", "only show one category: reactlynx, lynx-ui, or rspeedy; repeat to include more").argParser(
      collectCategory,
    ),
  )
  .option("--no-warnings", "hide warning-severity diagnostics")
  .option("--blocking <level>", "severity that fails the run: error, warning, none", "error")
  .option("--agent-prompt", "print a prompt for a coding agent after the scan")
  .option("--agent <command>", "launch an agent command and pipe the prompt to stdin")
  .option("--no-agent-select", "do not offer an interactive agent selection after the scan")
  .showHelpAfterError()
  .addHelpText(
    "after",
    `
Examples:
  $ lynx-doctor
  $ lynx-doctor ./apps/mobile --verbose
  $ lynx-doctor --diff origin/main --agent-prompt
  $ lynx-doctor --category reactlynx --json
  $ lynx-doctor install
`,
  );

program.action(async (directory: string, options: Record<string, unknown>) => {
  const shouldSelectAgentInteractively = canSelectAgentInteractively(options);
  const shouldShowAgentPromptHint =
    !options.agent && !options.agentPrompt && !shouldSelectAgentInteractively;
  const diff = parseDiff(options.diff as string | boolean | undefined);
  const categories = options.category as string[] | undefined;
  const report = await scanProject({
    directory,
    verbose: Boolean(options.verbose),
    staged: Boolean(options.staged),
    ...(diff === undefined || diff === false ? {} : { diff }),
    ...(categories ? { categories } : {}),
    includeWarnings: options.warnings !== false,
    blocking: parseBlocking(options.blocking as string | undefined)
  });

  if (options.score) {
    process.stdout.write(`${formatScore(report)}\n`);
  } else if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, options.jsonCompact ? 0 : 2)}\n`);
  } else {
    process.stdout.write(
      `${formatReport(report, {
        verbose: Boolean(options.verbose),
        showAgentPromptHint: shouldShowAgentPromptHint
      })}\n`,
    );
  }

  if (report.diagnostics.length > 0) {
    const prompt = buildAgentPrompt(report);
    if (options.agent) {
      await launchAgentOrPrintPrompt(String(options.agent), prompt, report.project.rootDirectory);
    } else if (options.agentPrompt) {
      printAgentPrompt(prompt);
    } else if (shouldSelectAgentInteractively) {
      const selection = await selectAgentInteractively();
      if (selection.type === "agent") {
        await launchAgentOrPrintPrompt(selection.command, prompt, report.project.rootDirectory);
      } else if (selection.type === "prompt") {
        printAgentPrompt(prompt);
      } else {
        process.stdout.write(pc.dim("Skipped agent handoff.\n"));
      }
    }
  }

  process.exitCode = report.ok ? 0 : 1;
});

program
  .command("install")
  .description("Add a Lynx Doctor package script, GitHub Actions workflow, and agent notes")
  .option("--dry-run", "show what would change without writing files")
  .option("-y, --yes", "accept defaults")
  .option("-c, --cwd <cwd>", "project root", process.cwd())
  .action((options: { dryRun?: boolean; yes?: boolean; cwd: string }) => {
    const result = installLynxDoctor({
      rootDirectory: options.cwd,
      ...(options.dryRun === undefined ? {} : { dryRun: options.dryRun }),
      ...(options.yes === undefined ? {} : { yes: options.yes })
    });
    for (const message of result.messages) process.stdout.write(`${message}\n`);
    if (result.changedFiles.length > 0) {
      process.stdout.write(`${result.dryRun ? "Would update" : "Updated"}:\n`);
      for (const filePath of result.changedFiles) process.stdout.write(`  ${filePath}\n`);
    } else {
      process.stdout.write("Already up to date.\n");
    }
  });

const rules = program.command("rules").description("List and explain built-in Lynx Doctor rules");

rules
  .command("list")
  .description("List rules")
  .option("--json", "output JSON")
  .action((options: { json?: boolean }, command: Command) => {
    if (shouldOutputJson(options, command)) {
      process.stdout.write(`${JSON.stringify(RULES, null, 2)}\n`);
      return;
    }
    process.stdout.write(`${formatRulesList(RULES)}\n`);
  });

rules
  .command("explain <ruleId>")
  .description("Explain one rule")
  .option("--json", "output JSON")
  .action((ruleId: string, options: { json?: boolean }, command: Command) => {
    const rule = RULES.find((candidate) => candidate.id === ruleId);
    if (!rule) {
      process.stderr.write(`Unknown rule: ${ruleId}\n`);
      process.exitCode = 1;
      return;
    }
    if (shouldOutputJson(options, command)) {
      process.stdout.write(`${JSON.stringify(rule, null, 2)}\n`);
      return;
    }
    process.stdout.write(`${pc.bold(rule.id)}\n`);
    process.stdout.write(`${rule.title}\n\n`);
    process.stdout.write(`Category: ${rule.category}\n`);
    process.stdout.write(`Subcategory: ${rule.subcategory}\n`);
    process.stdout.write(`Severity: ${rule.defaultSeverity}\n\n`);
    process.stdout.write(`${rule.why}\n\n`);
    process.stdout.write(`Fix: ${rule.fix}\n`);
    process.stdout.write(`Docs: ${rule.docsUrl}\n`);
    process.stdout.write(`Source: ${rule.source.skill} (${rule.source.protocol})\n`);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`${pc.red("lynx-doctor failed")}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
