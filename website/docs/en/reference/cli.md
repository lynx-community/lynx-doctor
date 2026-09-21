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
npx lynx-doctor@latest --category reactlynx --json
npx lynx-doctor@latest --agent-prompt
npx lynx-doctor@latest install
```

When diagnostics are found in an interactive terminal, Lynx Doctor prompts you
to choose a coding agent with an arrow-key menu after the scan. Machine-readable
modes such as `--json`, `--score`, and non-TTY output do not prompt.

Options:

| Option | Description |
| --- | --- |
| `--verbose` | Show every diagnostic with source context, documentation links, and skill source |
| `--json` | Output a structured JSON report |
| `--json-compact` | Emit compact JSON with `--json` |
| `--score` | Output only the numeric score |
| `--diff [base]` | Scan files changed against a base ref |
| `--staged` | Scan files staged in the git index |
| `--package` | Check existing component library entry artifacts after a build |
| `--category <category>` | Show one category, repeatable: `reactlynx`, `lynx-ui`, `rspeedy`, or `lynx-css` |
| `--no-warnings` | Hide warnings and show errors only |
| `--blocking <level>` | Set the failing threshold: `error`, `warning`, or `none` |
| `--agent-prompt` | Print a repair prompt for a coding agent |
| `--agent <command>` | Launch a local agent command and pipe the prompt to stdin |
| `--no-agent-select` | Disable the interactive agent selection prompt |

## Incremental scan scope

--diff combines branch changes from the merge base with staged, unstaged, and untracked files. Supply the actual PR target as the base when it is not main or master. Both incremental modes respect the same file ignores and package boundary as a full scan. Deleted files are skipped.

--staged reads source content from the Git index, including staged files removed from the working tree. Project dependencies and configuration are read from the working tree. Use one incremental mode at a time. An invalid base or a directory outside Git is an error; it does not silently turn into a full scan.
