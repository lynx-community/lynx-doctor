---
title: 配置
description: 配置 Lynx Doctor 的忽略文件、规则严重级别、分类开关和默认 agent handoff 命令。
---

# 配置

Lynx Doctor 会读取项目根目录下的 `lynx-doctor.config.ts`、`lynx-doctor.config.mjs`、`lynx-doctor.config.json`，也兼容 `doctor.config.*`。

```ts
import { defineConfig } from "lynx-doctor";

export default defineConfig({
  targets: { android: "3.5", ios: "3.6" },
  ignore: {
    files: ["src/generated/**"]
  },
  rules: {
    "reactlynx/lazy-without-suspense": "warning"
  },
  categories: {
    "lynx-ui": "off"
  },
  agent: {
    command: "codex"
  }
});
```

命令行参数会覆盖配置文件中的运行选项，例如：

```bash
npx lynx-doctor@latest --category reactlynx --json
```

`targets` 声明各渲染后端最低支持的 **Lynx 引擎**版本，不使用 ReactLynx npm 包版本。支持的后端与检查边界见 [CSS 兼容性](../rules/lynx-css)。

包含空字节或无效 UTF-8 的文件会在解析前自动跳过，即使扩展名是 `.lynx.js` 等源码扩展名。报告会通过提示列出这些文件路径，并将其排除在已扫描文件的覆盖范围之外。此行为适用于全量、diff 和 staged 扫描；文本形式的 `.lynx.js` 仍会正常检查。其他生成文件可通过 `ignore.files` 排除。

`agent.command` 仅在显式传入不带命令的 `--agent` 时使用。独立安装/npx 运行时，Doctor 会为配置解析 `defineConfig`；配置导入的其他项目依赖仍需先安装。
