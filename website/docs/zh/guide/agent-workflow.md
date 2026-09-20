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

Agent 成功退出后，Doctor 会自行复检，并以新报告决定 CLI 退出码。diff 扫描在修复后检查整个工作区，因此可能发现原 diff 外的问题。staged 扫描复检 Git 暂存区：仅存在于工作区的修复不能让暂存区检查通过；请审查并暂存修复后再次检查。Agent 启动或执行失败始终返回失败，即使使用了 `--blocking none`。

配置默认命令后仍需显式启用：

```json
{ "agent": { "command": "codex" } }
```

```bash
lynx-doctor --agent
lynx-doctor --agent claude
```

单独的 `--agent` 使用 `agent.command`，没有配置时默认使用 `codex`；显式命令优先。仅添加配置不会自动启动 Agent。自定义命令应是可执行文件路径；额外参数可放进包装脚本。

`--agent` 和 `--agent-prompt` 要求文本输出，请单独运行 `--json` 或 `--score`，防止机器输出混入 Agent 日志和提示词。复检不会自动暂存或提交改动。
