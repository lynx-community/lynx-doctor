---
title: CI Setup
description: Add Lynx Doctor to GitHub Actions so every pull request scans changed files for new Lynx-specific issues.
---

# CI Setup

Run the installer:

```bash
npx lynx-doctor@latest install
```

It writes:

- `.github/workflows/lynx-doctor.yml`
- a `doctor` package script in `package.json`
- `.agents/lynx-doctor.md`

The default workflow runs a diff scan on pull requests:

```bash
npx lynx-doctor@latest --diff --blocking warning
```

If the team is not ready to block warnings, use:

```bash
npx lynx-doctor@latest --diff --blocking error
```

For an advisory-only rollout:

```bash
npx lynx-doctor@latest --diff --blocking none
```
