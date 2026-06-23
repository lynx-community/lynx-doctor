---
title: 示例项目
description: 扫描独立的 Lynx 示例项目，体验健康项目、错误项目和 warning 项目的完整流程。
---

# 示例项目

仓库里的 `examples/` 目录包含几个独立的 Lynx 项目。它们参考了公开的 [lynx-family/lynx-examples](https://github.com/lynx-family/lynx-examples) 包结构：每个项目都有 `package.json`、`lynx.config.ts`、`tsconfig.json`、`src/index.tsx` 和 ReactLynx `App`。

示例使用固定版本的 Lynx 依赖，而不是 workspace `catalog:` 范围，因此可以单独复制、安装和运行。项目结构也贴近 Lynx [Quick Start](https://lynxjs.org/next/guide/start/quick-start)，并使用 Rspeedy + `pluginReactLynx`。

## 项目

| 项目 | 模拟场景 | 预期扫描结果 |
| --- | --- | --- |
| `examples/healthy-shop` | 一个小型商品页，包含安全的 native analytics 调用、带 directive 的 main-thread 手势处理，以及包在 `Suspense` 里的 lazy promo rail。 | `100/100`，没有诊断 |
| `examples/threading-regressions` | 一个 checkout 页面，故意在 render 里调用 native module，使用 `useLayoutEffect`，并遗漏 `main-thread:` handler directive。 | 3 个 `reactlynx` error |
| `examples/event-mode-settings` | 一个 settings 页面，开启 `globalPropsMode: "event"` 后仍直接读取 `lynx.__globalProps`，并且 lazy 组件没有 `Suspense`。 | 2 个 `reactlynx` warning |

## 扫描示例

先构建本地 CLI，再扫描示例目录：

```bash
pnpm build
node packages/lynx-doctor/dist/cli.js examples/healthy-shop --verbose --blocking none
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
node packages/lynx-doctor/dist/cli.js examples/event-mode-settings --verbose --blocking none
```

使用发布包时，也可以直接用 `npx` 扫描同样路径：

```bash
npx lynx-doctor@latest examples/threading-regressions --agent-prompt --blocking none
```

## 运行项目

每个示例都可以用 Rspeedy 运行：

```bash
cd examples/healthy-shop
pnpm install
pnpm dev
```

Rspeedy 会打印本地服务和 QR 入口，用来预览 ReactLynx bundle。示例刻意保持很小，方便你修一条规则、重新扫描，然后观察 agent prompt 如何变化。

## 唤起 Agent

可以用 regression 示例体验完整闭环：

```bash
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
```

生成的 prompt 会要求 agent：

- 把 `lynx.getJSModule("Analytics")` 从 render 移到 background-only 上下文
- 替换 `ReactLynx.useLayoutEffect`
- 为 main-thread handler 添加顶层 `"main thread"` directive

修完后重新运行同一条命令，确认对应规则消失。
