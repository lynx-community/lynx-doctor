# Lynx Doctor

Lynx Doctor is a deterministic scanner and agent handoff CLI for Lynx projects.
It finds Lynx-specific risks, explains why they matter, and generates focused
repair prompts for coding agents.

## Usage

Run a scan from a Lynx project root:

```bash
npx lynx-doctor@latest
```

Scan only changed files:

```bash
npx lynx-doctor@latest --diff
```

Generate a repair prompt:

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

## Node API

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

## Runtime

Lynx Doctor requires Node.js 22.12 or later and is published as an ESM package.

## Links

- Documentation: https://github.com/lynx-community/lynx-doctor#readme
- Issues: https://github.com/lynx-community/lynx-doctor/issues
- License: Apache-2.0
