---
title: Configuration
description: Configure Lynx Doctor ignored files, rule severities, category overrides, and default agent handoff command.
---

# Configuration

Lynx Doctor reads `lynx-doctor.config.ts`, `lynx-doctor.config.mjs`, `lynx-doctor.config.json`, and compatible `doctor.config.*` files from the project root.

```ts
import { defineConfig } from "lynx-doctor";

export default defineConfig({
  targets: { android: "3.5", ios: "3.6" },
  ignore: {
    files: ["src/generated/**"]
  },
  rules: {
    "reactlynx/lazy-without-suspense": "warning"
  },
  categories: {
    "lynx-ui": "off"
  },
  agent: {
    command: "codex"
  }
});
```

Command-line flags override run options from config files:

```bash
npx lynx-doctor@latest --category reactlynx --json
```

`targets` declares minimum **Lynx engine** versions per backend. It does not use the ReactLynx npm version. See [CSS compatibility](../rules/lynx-css) for coverage and supported backends.

Files containing null bytes or invalid UTF-8 are automatically skipped before parsing, even when they have a source extension such as `.lynx.js`. Their paths appear in report notices and are excluded from scanned-file coverage. This applies to full, diff, and staged scans; text `.lynx.js` files are still checked. Use `ignore.files` to exclude other generated files.

`agent.command` is used only when you explicitly pass bare `--agent`. The installed Doctor resolves `defineConfig` for standalone/npx configs; other imported project packages must still be installed.
