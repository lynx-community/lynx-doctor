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
  type BlockingLevel
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
    new Option("--category <category>", "only show one category; repeat to include more").argParser(
      collectCategory,
    ),
  )
  .option("--no-warnings", "hide warning-severity diagnostics")
  .option("--blocking <level>", "severity that fails the run: error, warning, none", "error")
  .option("--agent-prompt", "print a prompt for a coding agent after the scan")
  .option("--agent <command>", "launch an agent command and pipe the prompt to stdin")
  .showHelpAfterError()
  .addHelpText(
    "after",
    `
Examples:
  $ lynx-doctor
  $ lynx-doctor ./apps/mobile --verbose
  $ lynx-doctor --diff origin/main --agent-prompt
  $ lynx-doctor --category Threading --json
  $ lynx-doctor install
`,
  );

program.action(async (directory: string, options: Record<string, unknown>) => {
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
    process.stdout.write(`${formatReport(report, { verbose: Boolean(options.verbose) })}\n`);
  }

  if ((options.agentPrompt || options.agent) && report.diagnostics.length > 0) {
    const prompt = buildAgentPrompt(report);
    if (options.agent) {
      try {
        await launchAgent(String(options.agent), prompt, report.project.rootDirectory);
      } catch (error) {
        process.stderr.write(
          `${pc.yellow("Could not launch agent; printing prompt instead.")}\n${String(error)}\n\n`,
        );
        process.stdout.write(`${prompt}\n`);
      }
    } else {
      process.stdout.write(`\n${pc.dim("---- Agent prompt ----")}\n${prompt}\n`);
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
  .action((options: { json?: boolean }) => {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(RULES, null, 2)}\n`);
      return;
    }
    for (const category of CATEGORIES) {
      const categoryRules = RULES.filter((rule) => rule.category === category);
      if (categoryRules.length === 0) continue;
      process.stdout.write(`${pc.bold(category)}\n`);
      for (const rule of categoryRules) {
        process.stdout.write(`  ${rule.defaultSeverity.toUpperCase()} ${rule.id} - ${rule.title}\n`);
      }
    }
  });

rules
  .command("explain <ruleId>")
  .description("Explain one rule")
  .option("--json", "output JSON")
  .action((ruleId: string, options: { json?: boolean }) => {
    const rule = RULES.find((candidate) => candidate.id === ruleId);
    if (!rule) {
      process.stderr.write(`Unknown rule: ${ruleId}\n`);
      process.exitCode = 1;
      return;
    }
    if (options.json) {
      process.stdout.write(`${JSON.stringify(rule, null, 2)}\n`);
      return;
    }
    process.stdout.write(`${pc.bold(rule.id)}\n`);
    process.stdout.write(`${rule.title}\n\n`);
    process.stdout.write(`Category: ${rule.category}\n`);
    process.stdout.write(`Severity: ${rule.defaultSeverity}\n\n`);
    process.stdout.write(`${rule.why}\n\n`);
    process.stdout.write(`Fix: ${rule.fix}\n`);
    process.stdout.write(`Docs: ${rule.docsUrl}\n`);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`${pc.red("lynx-doctor failed")}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
