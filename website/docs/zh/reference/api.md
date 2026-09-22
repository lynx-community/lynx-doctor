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

检查已有组件库构建时可向 `scanProject` 传入 `package: true`，不能与 `diff` 或 `staged` 同时使用。CSS 目标配置类型为 `CssTargets`，检查覆盖信息记录在 `ScanReport.cssCoverage` 中。

源码解析失败会记录在 `ScanReport.parseErrors` 中，每个 `ParseError` 包含 `filePath`、`line`、`column` 和 `message`。其他文件会继续检查，解析失败的文件不会计入 `scannedFiles` 和适用源码覆盖数量。只要存在解析失败，`ok` 就为 `false`，即使设置了 `blocking: "none"`；规则过滤也不会隐藏解析失败。配置错误和内部异常仍会使扫描抛出异常。

`diagnostics`、`summary` 和数字 `score` 仅描述规则诊断，解释分数前请检查 `ok` 和 `parseErrors`。扫描不完整时，`formatScore` 返回 `N/A`，`buildAgentPrompt` 会包含解析错误，以便修复后重新验证。
