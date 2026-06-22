---
title: Quickstart
description: Run the first Lynx Doctor scan in a Lynx project and understand the score, findings, and next step.
---

# Quickstart

Run Lynx Doctor from the root of a Lynx project:

```bash
npx lynx-doctor@latest
```

The CLI detects project dependencies, Rspeedy configuration, TypeScript settings, and source files. It prints a health score, issue counts, category totals, and the highest-priority diagnostics.

Scan only files changed in the current branch:

```bash
npx lynx-doctor@latest --diff
```

Generate a repair prompt for an agent:

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

For the first pass, fix `Threading` and `Lifecycle` errors before lower-risk warnings. After editing, re-run `npx lynx-doctor@latest --verbose` and confirm the finding is gone.
