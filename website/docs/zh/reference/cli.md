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

如果在交互式终端中发现诊断结果，Lynx Doctor 会在扫描后弹出可用方向键选择的 coding agent 菜单。
`--json`、`--score` 和非 TTY 输出不会弹出交互提示。

选项：

| 选项 | 说明 |
| --- | --- |
| `--verbose` | 展示每条诊断的源码上下文、文档链接和 skill source |
| `--json` | 输出结构化 JSON 报告 |
| `--json-compact` | 配合 `--json` 输出压缩 JSON |
| `--score` | 只输出数字分数 |
| `--diff [base]` | 只扫描相对 base 变化的文件 |
| `--staged` | 只扫描 git index 中 staged 文件 |
| `--package` | 构建后检查组件库入口是否对应实际产物 |
| `--category <category>` | 只展示某个分类，可重复：`reactlynx`、`lynx-ui`、`rspeedy` 或 `lynx-css` |
| `--no-warnings` | 隐藏 warning，只看 error |
| `--blocking <level>` | 设置失败阈值：`error`、`warning`、`none` |
| `--agent-prompt` | 打印可交给 agent 的修复提示 |
| `--agent [command]` | 启动本地 agent 命令并把提示写入 stdin |
| `--no-agent-select` | 关闭扫描后的交互式 agent 选择 |

## 增量扫描范围

--diff 合并分支相对 merge base 的改动、暂存改动、未暂存改动和未跟踪文件。PR 目标不是 main 或 master 时，请显式指定实际目标分支。两种增量模式都会遵守与全量扫描相同的文件忽略规则和 package 边界，并跳过已删除文件。

--staged 从 Git index 读取源码，包括已暂存但在工作区中删除的文件。项目依赖和配置仍从工作区读取。两种增量模式不能同时启用；无效 base 或非 Git 目录会直接报错，不会悄悄变成全量扫描。

文本报告显示 full/diff/staged 范围及适用源文件数量。空扫描和没有适用 Lynx 源码的扫描不会显示 healthy 标签。为保持兼容，数字分数仍按诊断计算；解释分数前请同时查看 JSON 的 `scope`、`cssCoverage` 和 `notices`，不要把分数当作覆盖率。
