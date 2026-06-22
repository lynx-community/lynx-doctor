# Contribution Guide

<p align="center">
  <a href="./CONTRIBUTING.zh-CN.md">中文</a>
  ·
  <a href="./README.md">README</a>
</p>

Thanks for improving Lynx Doctor. This guide covers local development, documentation, examples, and verification.

## Requirements

- Node.js >= 20.19.0
- pnpm >= 10

Install workspace dependencies:

```bash
pnpm install
```

## Package Layout

```text
packages/lynx-doctor   CLI and Node API
website/               Rspress documentation site
examples/              Standalone Lynx projects
```

## Development Commands

Build everything:

```bash
pnpm build
```

Type-check:

```bash
pnpm typecheck
```

Run tests:

```bash
pnpm test
```

Run the full local check:

```bash
pnpm check
```

Watch the CLI package during development:

```bash
pnpm --filter lynx-doctor dev
```

## Documentation Site

The docs site is built with Rspress and includes English and Chinese content. English is the default locale at `/`; Chinese lives under `/zh/`.

Start the docs site:

```bash
pnpm docs:dev
```

Build the docs site:

```bash
pnpm docs:build
```

## Examples

The repository includes standalone Lynx projects under `examples/`. They intentionally stay outside the root workspace so they can be installed and run independently.

Run the local CLI against them:

```bash
pnpm build
node packages/lynx-doctor/dist/cli.js examples/healthy-shop --verbose --blocking none
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
node packages/lynx-doctor/dist/cli.js examples/event-mode-settings --verbose --blocking none
```

Install and run one example with Rspeedy:

```bash
cd examples/healthy-shop
pnpm install
pnpm dev
```

Build every example after installing their dependencies:

```bash
pnpm --dir examples/healthy-shop build
pnpm --dir examples/threading-regressions build
pnpm --dir examples/event-mode-settings build
```

## Before Sending Changes

Run:

```bash
pnpm check
```

For docs-only changes, also run:

```bash
pnpm docs:build
```

For example changes, run the relevant example build plus the Lynx Doctor scan for that example.
