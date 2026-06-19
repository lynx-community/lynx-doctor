---
title: CLI
description: Lynx Doctor command reference for diff scans, JSON output, category filtering, blocking, and agent handoff.
---

# CLI

```bash
lynx-doctor [directory] [options]
```

Common commands:

```bash
npx lynx-doctor@latest
npx lynx-doctor@latest --verbose
npx lynx-doctor@latest --diff origin/main
npx lynx-doctor@latest --category Threading --json
npx lynx-doctor@latest --agent-prompt
npx lynx-doctor@latest install
```

Options:

| Option | Description |
| --- | --- |
| `--verbose` | Show every diagnostic with source context and documentation links |
| `--json` | Output a structured JSON report |
| `--json-compact` | Emit compact JSON with `--json` |
| `--score` | Output only the numeric score |
| `--diff [base]` | Scan files changed against a base ref |
| `--staged` | Scan files staged in the git index |
| `--category <category>` | Show one category, repeatable |
| `--no-warnings` | Hide warnings and show errors only |
| `--blocking <level>` | Set the failing threshold: `error`, `warning`, or `none` |
| `--agent-prompt` | Print a repair prompt for a coding agent |
| `--agent <command>` | Launch a local agent command and pipe the prompt to stdin |
