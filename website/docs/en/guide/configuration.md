---
title: Configuration
description: Configure Lynx Doctor ignored files, rule severities, category overrides, and default agent handoff command.
---

# Configuration

Lynx Doctor reads `lynx-doctor.config.ts`, `lynx-doctor.config.mjs`, `lynx-doctor.config.json`, and compatible `doctor.config.*` files from the project root.

```ts
import { defineConfig } from "lynx-doctor";

export default defineConfig({
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
