---
title: Node API
description: Use the Lynx Doctor Node API to scan projects, format reports, create agent prompts, and install CI files.
---

# Node API

```ts
import { buildAgentPrompt, formatReport, scanProject } from "lynx-doctor";

const report = await scanProject({
  directory: process.cwd(),
  diff: true,
  blocking: "warning"
});

console.log(formatReport(report, { verbose: true }));
console.log(buildAgentPrompt(report));
```

Main exports:

- `scanProject(options)`: run a scan and return a `ScanReport`
- `formatReport(report, options)`: generate terminal report text
- `buildAgentPrompt(report)`: generate an agent repair prompt
- `installLynxDoctor(options)`: write workflow, script, and agent notes
- `defineConfig(config)`: add type hints to config files
- `RULES`: inspect built-in rules, categories, subcategories, docs URLs, and skill source metadata
