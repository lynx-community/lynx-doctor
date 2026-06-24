---
title: 配置
description: 配置 Lynx Doctor 的忽略文件、规则严重级别、分类开关和默认 agent handoff 命令。
---

# 配置

Lynx Doctor 会读取项目根目录下的 `lynx-doctor.config.ts`、`lynx-doctor.config.mjs`、`lynx-doctor.config.json`，也兼容 `doctor.config.*`。

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
