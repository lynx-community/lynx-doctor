---
title: Examples
description: Scan standalone Lynx example projects that demonstrate clean, error, and warning workflows.
---

# Examples

The repository includes standalone Lynx projects under `examples/`. They are shaped after the public [lynx-family/lynx-examples](https://github.com/lynx-family/lynx-examples) packages: each project has `package.json`, `lynx.config.ts`, `tsconfig.json`, `src/index.tsx`, and a ReactLynx `App`.

The examples use pinned Lynx package versions instead of workspace `catalog:` ranges, so each one can be copied or installed independently. The project shape follows the Lynx [Quick Start](https://lynxjs.org/next/guide/start/quick-start) and uses Rspeedy with `pluginReactLynx`.

## Projects

| Project | What it models | Expected scan |
| --- | --- | --- |
| `examples/healthy-shop` | A small storefront with a safe native analytics call, a main-thread gesture handler, and a lazy promo rail wrapped in `Suspense`. | `100/100`, no diagnostics |
| `examples/threading-regressions` | A checkout screen with a render-time native module call, `useLayoutEffect`, and a `main-thread:` handler without a directive. | 3 errors across Threading, Lifecycle, and Events |
| `examples/event-mode-settings` | A settings screen using `globalPropsMode: "event"` while reading `lynx.__globalProps` directly and rendering a lazy component without `Suspense`. | 2 warnings across Configuration and Performance |

## Scan The Examples

Build the local CLI once, then scan the example directories:

```bash
pnpm build
node packages/lynx-doctor/dist/cli.js examples/healthy-shop --verbose --blocking none
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
node packages/lynx-doctor/dist/cli.js examples/event-mode-settings --verbose --blocking none
```

For the published package, use the same paths with `npx`:

```bash
npx lynx-doctor@latest examples/threading-regressions --agent-prompt --blocking none
```

## Run A Project

Each example runs with Rspeedy:

```bash
cd examples/healthy-shop
pnpm install
pnpm dev
```

Rspeedy prints a local server and QR entry for previewing the ReactLynx bundle. The examples are intentionally small so you can change one rule violation, rescan, and see how the agent prompt changes.

## Agent Handoff

Use the regression example to try the complete flow:

```bash
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
```

The prompt should ask an agent to:

- move `lynx.getJSModule("Analytics")` out of render and into a background-only context
- replace `ReactLynx.useLayoutEffect`
- add a top-level `"main thread"` directive to the main-thread handler

After applying a fix, rerun the same command and confirm the affected rule disappears.
