<h1 align="center">Lynx Doctor</h1>

<p align="center">
  先诊断，再让 Agent 修。
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <a href="./CONTRIBUTING.zh-CN.md">贡献指南</a>
  ·
  <a href="./website/docs/zh/index.mdx">中文文档</a>
  ·
  <a href="./examples">示例项目</a>
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D22.12.0-339933" alt="Node.js 22.12+" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-%3E%3D10-F69220" alt="pnpm 10+" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="Apache License 2.0" /></a>
</p>

<p align="center">
  <img src="./assets/readme-banner.zh-CN.svg" alt="Lynx Doctor banner：扫描项目、解释问题、交给 Agent 修复。" width="100%" />
</p>

Lynx Doctor 是面向 Lynx 项目的确定性扫描器与 Agent 交接 CLI。它会扫描项目中的 Lynx 专属风险，解释问题原因，并生成可交给 coding agent 的聚焦修复提示。

## 亮点

| 工作流 | Lynx Doctor 提供什么 |
| --- | --- |
| 扫描项目 | 健康分数、分类诊断、源码位置和修复建议 |
| 检查改动 | 使用 `--diff` 和 `--staged` 支持 PR 场景 |
| 交给 Agent | 输出聚焦 prompt，说明高优先级问题和验证步骤 |
| 接入 CI | 生成 package script、GitHub Actions workflow 和 agent notes |

## 为什么需要它

Lynx 项目有很多通用 JavaScript linter 不理解的约束：

- 代码可能跨越主线程和后台线程边界
- 部分 Lynx API 只能在后台线程调用
- `main-thread:` handler 需要显式 directive
- Rspeedy 和 TypeScript 配置会影响运行时行为
- lazy bundle 需要安全的加载边界

Lynx Doctor 会在 Agent 开始改代码之前，把这些约束和风险先暴露出来。

## 快速开始

在 Lynx 项目根目录运行：

```bash
npx lynx-doctor@latest
```

只扫描当前改动：

```bash
npx lynx-doctor@latest --diff
```

生成修复 prompt：

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

直接启动本地 Agent 命令：

```bash
npx lynx-doctor@latest --diff --agent codex
```

## 检查范围

| 分类 | 示例 |
| --- | --- |
| reactlynx | 线程边界、生命周期、main-thread handler、`globalPropsMode`、lazy loading 和 TypeScript 设置 |
| lynx-ui | 公共组件 import、文档化组件 API 和手势配置 |
| rspeedy | `export *` barrel 和 `eval()` 等包体积风险 |

查看规则：

```bash
npx lynx-doctor@latest rules list
```

解释单条规则：

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```

## CLI

```bash
lynx-doctor [directory] [options]
```

| 参数 | 说明 |
| --- | --- |
| `--verbose` | 展示每条诊断的源码上下文、文档和 skill source |
| `--json` | 输出结构化扫描报告 |
| `--score` | 只输出数字健康分 |
| `--diff [base]` | 扫描相对 base 变化的文件 |
| `--staged` | 只扫描 staged 文件 |
| `--category <category>` | 只展示某个分类，可重复：`reactlynx`、`lynx-ui` 或 `rspeedy` |
| `--no-warnings` | 隐藏 warning 级别诊断 |
| `--blocking <level>` | 设置失败阈值：`error`、`warning` 或 `none` |
| `--agent-prompt` | 打印聚焦的 Agent 修复 prompt |
| `--agent <command>` | 把修复 prompt 传给本地 Agent 命令 |

安装 CI 和 agent notes：

```bash
npx lynx-doctor@latest install
```

## 配置

在项目根目录创建 `lynx-doctor.config.ts`、`lynx-doctor.config.mjs` 或 `lynx-doctor.config.json`。

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

## Node API

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

## 示例项目

仓库中的 `examples/` 目录包含几个独立的 Lynx 项目。

| 项目 | 用途 |
| --- | --- |
| `examples/healthy-shop` | 健康项目，预期扫描结果为 `100/100` |
| `examples/threading-regressions` | 故意包含 `reactlynx` 线程、生命周期和事件错误 |
| `examples/event-mode-settings` | 演示 `reactlynx` 配置和 lazy-loading warning |

本地开发、文档站和示例验证请参考 [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md)。

## 许可证

Apache License 2.0
