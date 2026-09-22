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

For an existing component library build, pass `package: true` to `scanProject`. This option cannot be combined with `diff` or `staged`. CSS configuration is available through `CssTargets`, and `ScanReport.cssCoverage` records coverage.

Source parsing failures are returned in `ScanReport.parseErrors` as `ParseError` entries with `filePath`, `line`, `column`, and `message`. Other files continue to be checked, and failed files are excluded from `scannedFiles` and applicable coverage. Any parse failure sets `ok` to `false`, including with `blocking: "none"`; rule filters do not hide parse failures. Configuration and unexpected internal errors still reject the scan.

`diagnostics`, `summary`, and the numeric `score` describe rule findings only. Check `ok` and `parseErrors` before interpreting that score. `formatScore` returns `N/A` for incomplete scans, and `buildAgentPrompt` includes the parsing failures so they can be resolved and verified.
