---
title: Node API
description: 使用 Lynx Doctor 的 Node API 执行扫描、格式化报告、生成 agent prompt 和安装 CI。
---

# Node API

```ts
import { buildAgentPrompt, formatReport, scanProject } from "lynx-doctor";

const report = await scanProject({
  directory: process.cwd(),
  diff: true,
  blocking: "warning"
});

console.log(formatReport(report, { verbose: true }));
console.log(buildAgentPrompt(report));
```

主要导出：

- `scanProject(options)`：执行扫描并返回 `ScanReport`
- `formatReport(report, options)`：生成终端文本报告
- `buildAgentPrompt(report)`：生成 agent 修复提示
- `installLynxDoctor(options)`：写入 workflow、script 和 agent notes
- `defineConfig(config)`：为配置文件提供类型提示
- `RULES`：查看内置规则、一级分类、二级分类、文档 URL 和 skill source metadata
