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

When diagnostics are found in an interactive terminal, Lynx Doctor offers an
arrow-key menu to launch Codex, launch Claude, print the prompt, or skip.

## Compatibility and verification

Configure minimum Lynx engine versions in `lynx-doctor.config.json` to enable CSS checks:

```json
{ "targets": { "android": "3.5", "ios": "3.6" } }
```

Run `--package` after building a component library to validate literal runtime/declaration entry files. Reports expose scan scope and unknown/skipped CSS coverage.

`--agent [command]` verifies the result after a successful handoff; staged verification still checks the index. Use JSON/score output separately from handoffs. `install --dry-run` previews a version-pinned script and project-aware CI without overwriting existing setup.

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
