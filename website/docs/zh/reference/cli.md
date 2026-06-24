---
title: CLI
description: Lynx Doctor 命令行参数参考，包括 diff 扫描、JSON 输出、规则过滤和 agent handoff。
---

# CLI

```bash
lynx-doctor [directory] [options]
```

常用命令：

```bash
npx lynx-doctor@latest
npx lynx-doctor@latest --verbose
npx lynx-doctor@latest --diff origin/main
npx lynx-doctor@latest --category reactlynx --json
npx lynx-doctor@latest --agent-prompt
npx lynx-doctor@latest install
```

选项：

| 选项 | 说明 |
| --- | --- |
| `--verbose` | 展示每条诊断的源码上下文、文档链接和 skill source |
| `--json` | 输出结构化 JSON 报告 |
| `--json-compact` | 配合 `--json` 输出压缩 JSON |
| `--score` | 只输出数字分数 |
| `--diff [base]` | 只扫描相对 base 变化的文件 |
| `--staged` | 只扫描 git index 中 staged 文件 |
| `--category <category>` | 只展示某个分类，可重复：`reactlynx`、`lynx-ui` 或 `rspeedy` |
| `--no-warnings` | 隐藏 warning，只看 error |
| `--blocking <level>` | 设置失败阈值：`error`、`warning`、`none` |
| `--agent-prompt` | 打印可交给 agent 的修复提示 |
| `--agent <command>` | 启动本地 agent 命令并把提示写入 stdin |
