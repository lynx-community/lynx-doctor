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
