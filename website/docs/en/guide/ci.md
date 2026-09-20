---
title: CI Setup
description: Install reproducible Lynx Doctor commands and project-aware GitHub Actions without overwriting team configuration.
---

# CI Setup

Preview or apply setup:

```bash
npx lynx-doctor@latest install --dry-run
npx lynx-doctor@latest install
npm run doctor
```

The installer adds a `doctor` script using `npx --yes` and the exact version of the running Doctor. It works without adding a local devDependency. It also creates `.agents/lynx-doctor.md` and `.github/workflows/lynx-doctor.yml`. Existing scripts, workflows, and agent notes are preserved byte-for-byte, including with `--yes`. Repeated installation makes no further changes. Upgrade existing pinned commands by reviewing and editing them explicitly.

In a monorepo, run the installer from the app package. The workflow belongs at the Git root, dependency installation uses the root workspace when available, and scans run in the selected app directory. The generated dependency step detects pnpm, Yarn, npm, or Bun lockfiles. A repository without a root package installs the selected app's dependencies instead. Review custom workspace bootstrapping needs before enabling the workflow.

PR runs compare with the actual PR base commit and check the PR head. Pushes to `main` and manual runs scan the full project. The workflow uses read-only repository permissions, disables persisted checkout credentials, and installs project dependencies so inherited TypeScript configs can resolve. It does not post comments or run coding agents.

The default blocking threshold is `warning`. For a gradual rollout, change it to `error` or `none`:

```bash
npm run doctor -- --diff origin/main --blocking error
npm run doctor -- --blocking none
```

Doctor's own version is pinned in the generated workflow and script. Rule source revisions and CSS compatibility data are pinned separately. CSS checks require explicit engine `targets`; component library artifact checks require a build followed by `--package`.
