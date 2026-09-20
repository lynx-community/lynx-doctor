---
title: Agent Workflow
description: Turn Lynx Doctor scan results into focused repair prompts that guide coding agents from diagnosis to verification.
---

# Agent Workflow

Lynx Doctor does not dump every issue into one giant prompt. It groups the highest-priority rules so the agent can fix one root cause at a time.

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

The prompt includes:

- current project and score
- highest-priority rules
- representative file locations for each rule
- fix recipes and rule documentation
- the verification command to re-run

If a local agent CLI is available, launch it directly:

```bash
npx lynx-doctor@latest --diff --agent codex
```

Agents should follow three rules:

1. Read the files before editing.
2. Fix the root cause instead of silencing the rule.
3. Re-run Lynx Doctor and verify the diagnostic disappeared.

After a successful handoff, Doctor runs verification itself and derives the CLI exit status from the new report. Diff scans verify the full working tree, so new findings can appear outside the original diff. Staged scans recheck the index: a fix that exists only in the working tree cannot pass a staged gate. Review and stage fixes, then re-run the staged scan. Agent launch/process failures always exit unsuccessfully, including with `--blocking none`.

Configure a default command and opt in explicitly:

```json
{ "agent": { "command": "codex" } }
```

```bash
lynx-doctor --agent
lynx-doctor --agent claude
```

Bare `--agent` uses `agent.command` or falls back to `codex`; an explicit command overrides the configuration. Configuration alone never starts an agent. A custom command is an executable path (use a wrapper script for extra arguments).

`--agent` and `--agent-prompt` require text output. Run `--json` or `--score` separately to keep machine output free of agent logs and prompts. Verification does not automatically stage or commit changes.
