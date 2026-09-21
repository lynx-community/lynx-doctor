---
title: 快速开始
description: 在 Lynx 项目中运行检查，查看评分、问题位置和修改建议。
---

# 快速开始

在 Lynx 项目根目录运行：

```bash
npx lynx-doctor@latest
```

Lynx Doctor 会检查项目依赖、Rspeedy 配置、TypeScript 设置和源文件。结果包含项目评分、错误和警告数量，以及需要优先处理的问题。

只检查有改动的文件：

```bash
npx lynx-doctor@latest --diff
```

根据检查结果，生成可交给 Agent 的修复提示词：

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

建议先修复 `reactlynx` 分类下的错误（error），再处理警告（warning）。修改后运行 `npx lynx-doctor@latest --verbose`，确认相关问题不再出现。
