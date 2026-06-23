---
title: 规则概览
description: Lynx Doctor 内置规则概览，按 reactlynx、lynx-ui 和 rspeedy skill source 分组。
---

# 规则概览

Lynx Doctor 规则来自 Lynx 社区 skills 的可执行化整理。规则包含一级 `category` 和二级 `subcategory`。

- [reactlynx](./reactlynx)
- [lynx-ui](./lynx-ui)
- [rspeedy](./rspeedy)

CLI 的 `category` 使用一级领域：`reactlynx`、`lynx-ui` 或 `rspeedy`。

## reactlynx

Source skill：[`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices)

### threading

- `reactlynx/background-only-api`：检测不在明确 background-only 上下文中的 `lynx.getJSModule` 和 `NativeModules`。

### lifecycle

- `reactlynx/avoid-use-layout-effect`：标记 `useLayoutEffect`，它在 ReactLynx 中不具备 React DOM 的同步布局语义。

### events

- `reactlynx/main-thread-handler-directive`：检查 `main-thread:*` 事件 handler 是否指向带顶层 `"main thread"` directive 的函数。

### configuration

- `reactlynx/global-props-event-mode`：当 `globalPropsMode` 为 `event` 时，直接读取 `lynx.__globalProps` 且没有使用 `useGlobalPropsChanged` 会触发 warning。
- `reactlynx/typescript-jsx-import-source`：检查 `tsconfig.json` 中 ReactLynx 和 Rspeedy 需要的 `jsxImportSource` 与 `isolatedModules` 设置。
- `reactlynx/types-package-missing`：提示 ReactLynx package 没有声明 `@lynx-js/types`。

### performance

- `reactlynx/lazy-without-suspense`：检测同文件中没有明显 `Suspense` 边界的 lazy component loading。

## lynx-ui

Source skill：[`lynx-ui`](https://github.com/lynx-community/skills/tree/release/skills/lynx-ui)

### imports

- `lynx-ui/prefer-public-aggregate-import`：提示代码直接从 `@lynx-js/lynx-ui-*` 组件包 import。

### component-api

- `lynx-ui/button-uses-on-click`：检测 `Button` 使用原生 `bind*` 或 `catch*` tap handler，而不是文档化的 `onClick` prop。

### gestures

- `lynx-ui/gesture-components-enable-new-gesture`：提示使用手势驱动的 lynx-ui 组件时没有开启 `enableNewGesture: true`。

## rspeedy

Source skill：[`rspeedy-bundle-size`](https://github.com/lynx-community/skills/tree/release/skills/rspeedy-bundle-size)

### bundle-size

- `rspeedy/no-export-star-barrels`：检测可能影响 tree-shaking、把额外代码带进 rspeedy bundle 的 `export *` barrel 文件。
- `rspeedy/no-eval-in-bundle-code`：检测源码中的 `eval()`，因为它可能影响生产 bundle 的 name mangling。

查看本地规则：

```bash
npx lynx-doctor@latest rules list
```

解释单条规则：

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```
