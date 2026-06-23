---
title: Rules Overview
description: Overview of built-in Lynx Doctor rules grouped by reactlynx, lynx-ui, and rspeedy skill sources.
---

# Rules Overview

Lynx Doctor rules are an executable distillation of Lynx community skills. Rules have a first-level `category` and a second-level `subcategory`.

- [reactlynx](./reactlynx)
- [lynx-ui](./lynx-ui)
- [rspeedy](./rspeedy)

The CLI `category` field uses the first-level domain: `reactlynx`, `lynx-ui`, or `rspeedy`.

## reactlynx

Source skill: [`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices)

### threading

- `reactlynx/background-only-api`: detects `lynx.getJSModule` and `NativeModules` outside an obvious background-only context.

### lifecycle

- `reactlynx/avoid-use-layout-effect`: flags `useLayoutEffect`, which does not provide React DOM style synchronous layout behavior in ReactLynx.

### events

- `reactlynx/main-thread-handler-directive`: checks that `main-thread:*` event handlers point at functions with a top-level `"main thread"` directive.

### configuration

- `reactlynx/global-props-event-mode`: warns when `globalPropsMode` is `event` while code reads `lynx.__globalProps` directly without `useGlobalPropsChanged`.
- `reactlynx/typescript-jsx-import-source`: checks `tsconfig.json` for `jsxImportSource` and `isolatedModules` settings expected by ReactLynx and Rspeedy.
- `reactlynx/types-package-missing`: warns when a ReactLynx package does not declare `@lynx-js/types`.

### performance

- `reactlynx/lazy-without-suspense`: detects lazy component loading without an obvious `Suspense` boundary in the same file.

## lynx-ui

Source skill: [`lynx-ui`](https://github.com/lynx-community/skills/tree/release/skills/lynx-ui)

### imports

- `lynx-ui/prefer-public-aggregate-import`: warns when code imports directly from `@lynx-js/lynx-ui-*` component packages.

### component-api

- `lynx-ui/button-uses-on-click`: detects `Button` usage with native `bind*` or `catch*` tap handlers instead of the documented `onClick` prop.

### gestures

- `lynx-ui/gesture-components-enable-new-gesture`: warns when gesture-driven lynx-ui components are used without `enableNewGesture: true`.

## rspeedy

Source skill: [`rspeedy-bundle-size`](https://github.com/lynx-community/skills/tree/release/skills/rspeedy-bundle-size)

### bundle-size

- `rspeedy/no-export-star-barrels`: detects `export *` barrel files that can defeat tree-shaking and pull extra code into rspeedy bundles.
- `rspeedy/no-eval-in-bundle-code`: detects `eval()` in source files because it can poison production name mangling in bundled output.

List local rules:

```bash
npx lynx-doctor@latest rules list
```

Explain one rule:

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```
