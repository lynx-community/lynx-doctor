---
title: 快速开始
description: 从安装运行到读取分数和诊断，快速在 Lynx 项目里完成第一次 Lynx Doctor 扫描。
---

# 快速开始

在 Lynx 项目根目录运行：

```bash
npx lynx-doctor@latest
```

CLI 会识别项目依赖、Rspeedy 配置、TypeScript 设置和源码文件，然后输出健康分数、问题数量、分类摘要和最高优先级诊断。

只扫描当前改动：

```bash
npx lynx-doctor@latest --diff
```

生成给 agent 的修复提示：

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

第一轮建议先修 `Threading` 和 `Lifecycle` 的 error，再处理配置类 warning。修完后重新运行 `npx lynx-doctor@latest --verbose`，确认问题确实消失。
