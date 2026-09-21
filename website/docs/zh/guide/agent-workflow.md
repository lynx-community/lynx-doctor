---
title: Agent 工作流
description: 将检查结果整理成修复提示词，交给本地编程 Agent，并在修改后重新检查。
---

# Agent 工作流

Lynx Doctor 会按规则整理需要优先处理的问题，生成包含代码位置和修改建议的提示词：

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

提示词包含：

- 项目名称和当前评分
- 需要优先处理的检查规则
- 对应的文件路径和行号
- 修改建议和规则文档
- 修改后需要运行的检查命令

如果本机已配置好 Codex 等编程 Agent，也可以直接调用它进行修复：

```bash
npx lynx-doctor@latest --diff --agent codex
```

给 Agent 的修复要求：

1. 先阅读相关代码，确认问题原因，再进行修改。
2. 修复代码本身，不要仅靠关闭检查规则来消除报错。
3. 修改后重新运行 Lynx Doctor，确认相关问题已解决。
