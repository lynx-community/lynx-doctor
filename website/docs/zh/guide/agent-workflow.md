---
title: Agent 工作流
description: 使用 Lynx Doctor 将扫描结果整理成 agent 修复提示，完成发现问题到自动修复的闭环。
---

# Agent 工作流

Lynx Doctor 的 handoff 不是把所有问题一次性塞给 agent，而是把最高优先级规则分组，让 agent 一次修一组根因。

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

输出会包含：

- 当前项目和分数
- 最高优先级规则
- 每组规则的代表文件位置
- 对应修复策略和规则文档
- 重新验证命令

如果本机有可用 agent CLI，可以直接启动：

```bash
npx lynx-doctor@latest --diff --agent codex
```

Agent 修复时应遵守三条原则：

1. 先读文件，再编辑。
2. 修根因，不用注释关闭规则。
3. 改完重跑 Lynx Doctor，确认诊断消失。
