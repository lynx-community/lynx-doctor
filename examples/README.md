# Lynx Doctor Examples

These examples are standalone Lynx projects shaped after the public
`lynx-family/lynx-examples` packages and the Lynx Quick Start project layout.

## Projects

| Project | Purpose | Expected Lynx Doctor result |
| --- | --- | --- |
| `healthy-shop` | A small product storefront with safe background and main-thread boundaries. | No diagnostics. |
| `threading-regressions` | A realistic product page with common threading and lifecycle mistakes. | Threading, lifecycle, and event errors. |
| `event-mode-settings` | A settings page using `globalPropsMode: "event"` with stale global-props and lazy-loading warnings. | Configuration and performance warnings. |

## Scan locally

From the repository root:

```bash
pnpm build
node packages/lynx-doctor/dist/cli.js examples/healthy-shop --verbose --blocking none
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
node packages/lynx-doctor/dist/cli.js examples/event-mode-settings --verbose --blocking none
```

Each example can also be installed and run independently:

```bash
cd examples/healthy-shop
pnpm install
pnpm dev
```

The projects intentionally use pinned versions instead of workspace `catalog:` ranges so they remain runnable outside this repository.
