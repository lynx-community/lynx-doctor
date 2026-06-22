# Lynx Doctor

Deterministic diagnostics and agent handoff for Lynx projects.

Lynx Doctor scans a project, explains the highest-risk Lynx-specific issues, and turns the findings into focused repair prompts that a coding agent can act on.

## Why

ReactLynx projects have constraints that generic JavaScript linters do not understand:

- code can cross main-thread and background-thread boundaries
- some Lynx APIs are background-only
- `main-thread:` handlers need explicit directives
- Rspeedy and TypeScript configuration shape runtime behavior
- lazy bundles need safe loading boundaries

Lynx Doctor makes those constraints visible before an agent starts editing code.

## Quick Start

Run a scan from a Lynx or ReactLynx project root:

```bash
npx lynx-doctor@latest
```

Scan only changed files:

```bash
npx lynx-doctor@latest --diff
```

Generate a repair prompt for a coding agent:

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

Launch a local agent command directly:

```bash
npx lynx-doctor@latest --diff --agent codex
```

## What It Checks

Built-in rules currently cover:

| Area | Examples |
| --- | --- |
| Threading | `lynx.getJSModule` and `NativeModules` outside obvious background-only contexts |
| Lifecycle | `useLayoutEffect` in ReactLynx code |
| Events | `main-thread:*` handlers missing a top-level `"main thread"` directive |
| Configuration | missing `@lynx-js/types`, incomplete `jsxImportSource`, `globalPropsMode: "event"` direct reads |
| Performance | `lazy()` without a nearby `Suspense` boundary |

List rules:

```bash
npx lynx-doctor@latest rules list
```

Explain one rule:

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```

## CLI

```bash
lynx-doctor [directory] [options]
```

Common options:

| Option | Description |
| --- | --- |
| `--verbose` | Show every diagnostic with source context |
| `--json` | Output a structured scan report |
| `--score` | Print only the numeric health score |
| `--diff [base]` | Scan files changed against a base ref |
| `--staged` | Scan only staged files |
| `--category <category>` | Show one category, repeatable |
| `--no-warnings` | Hide warning-severity diagnostics |
| `--blocking <level>` | Fail threshold: `error`, `warning`, or `none` |
| `--agent-prompt` | Print a focused agent repair prompt |
| `--agent <command>` | Pipe the repair prompt to a local agent command |

Install CI and agent notes:

```bash
npx lynx-doctor@latest install
```

## Configuration

Create `lynx-doctor.config.ts`, `lynx-doctor.config.mjs`, or `lynx-doctor.config.json` in the project root.

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
    Performance: "off"
  },
  agent: {
    command: "codex"
  }
});
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

## Examples

The repository includes standalone Rspeedy + ReactLynx projects under `examples/`.

| Project | Purpose |
| --- | --- |
| `examples/healthy-shop` | A clean project that should scan at `100/100` |
| `examples/threading-regressions` | Intentional Threading, Lifecycle, and Events errors |
| `examples/event-mode-settings` | Configuration and Performance warnings |

See [CONTRIBUTION.md](./CONTRIBUTION.md) for local development, docs, and example validation.

## License

MIT
