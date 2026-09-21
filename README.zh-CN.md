<p align="center">
  <img src="./website/docs/public/lynx-mascot-simple.png" alt="戴着医生帽的 Lynx Doctor 小山猫" width="112" height="112" />
</p>

<h1 align="center">Lynx Doctor</h1>

<p align="center">
  <strong>Lynx 项目的代码检查工具</strong><br />
  检查线程用法、API 调用和构建配置，定位问题并给出修改建议。
</p>

<p align="center">
  <a href="https://lynx-community.github.io/lynx-doctor/zh/">中文文档</a>
  ·
  <a href="https://lynx-community.github.io/lynx-doctor/zh/guide/quickstart.html">快速开始</a>
  ·
  <a href="./examples">示例项目</a>
  ·
  <a href="./CONTRIBUTING.zh-CN.md">贡献指南</a>
  ·
  <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D22.12.0-339933" alt="Node.js 22.12+" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="Apache License 2.0" /></a>
</p>

## 从这里开始

<table width="100%">
  <tr>
    <td align="center" valign="top" width="33%">
      <a href="#快速开始"><img src="./assets/readme/scan.png" alt="医生小山猫拿着放大镜检查代码" width="100%" /></a>
      <p><strong><a href="#快速开始">检查代码 →</a></strong><br />查看问题位置和修改建议。</p>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="#让-agent-帮你修复"><img src="./assets/readme/agent.png" alt="医生小山猫拿着修复检查单" width="100%" /></a>
      <p><strong><a href="#让-agent-帮你修复">让 Agent 修复 →</a></strong><br />生成提示词，或调用本地 Agent。</p>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="#接入-ci"><img src="./assets/readme/ci.png" alt="医生小山猫确认工作流检查通过" width="100%" /></a>
      <p><strong><a href="#接入-ci">接入 CI →</a></strong><br />在 Pull Request 中自动检查。</p>
    </td>
  </tr>
</table>

## 快速开始

需要 **Node.js 22.12 或更高版本**。在 Lynx 项目根目录运行：

```bash
npx lynx-doctor@latest
```

只检查有改动的文件：

```bash
npx lynx-doctor@latest --diff
```

## 让 Agent 帮你修复

生成包含代码位置、修改建议和检查命令的提示词：

```bash
npx lynx-doctor@latest --diff --agent-prompt
```

如果本机已经配置好编程 Agent，也可以直接调用它：

```bash
npx lynx-doctor@latest --diff --agent codex
```

在交互式终端中，检查发现问题后也会显示 Agent 选择菜单。具体用法见 [Agent 使用指南](https://lynx-community.github.io/lynx-doctor/zh/guide/agent-workflow.html)。

## 接入 CI

在项目根目录运行一次：

```bash
npx lynx-doctor@latest install
```

这条命令会添加 `doctor` 脚本、GitHub Actions 工作流，以及供 Agent 阅读的 `.agents/lynx-doctor.md`。默认工作流会检查 Pull Request 中有改动的文件，发现错误或警告时返回失败。调整方式见 [CI 设置](https://lynx-community.github.io/lynx-doctor/zh/guide/ci.html)。

## 检查范围

| 分类 | 示例 |
| --- | --- |
| `reactlynx` | 线程用法、生命周期 Hook、主线程事件、`globalPropsMode`、懒加载和 TypeScript 配置 |
| `lynx-ui` | 组件导入、属性用法和手势配置 |
| `rspeedy` | `export *` 批量重导出、`eval()` 等可能影响包体积的用法 |

查看规则：

```bash
npx lynx-doctor@latest rules list
```

查看某条规则的说明：

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```

<details>
<summary><strong>命令参数、配置与 Node API</strong></summary>

### 命令参数

```bash
lynx-doctor [directory] [options]
```

| 参数 | 说明 |
| --- | --- |
| `--verbose` | 显示每个问题附近的代码、规则文档和规则来源 |
| `--json` | 以 JSON 格式输出检查报告 |
| `--score` | 只输出项目评分 |
| `--diff [base]` | 检查相对于指定 Git 版本有改动的文件 |
| `--staged` | 只检查 Git 暂存区中的文件 |
| `--category <category>` | 选择 `reactlynx`、`lynx-ui` 或 `rspeedy` 分类，可多次使用 |
| `--no-warnings` | 隐藏警告 |
| `--blocking <level>` | 设置何时返回失败：`error`、`warning` 或 `none` |
| `--agent-prompt` | 输出修复提示词 |
| `--agent <command>` | 将修复提示词传给本地 Agent 命令 |
| `--no-agent-select` | 关闭检查后的 Agent 选择菜单 |

完整用法见 [命令说明](https://lynx-community.github.io/lynx-doctor/zh/reference/cli.html)。

### 配置

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

### Node API

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

</details>

## 示例项目

仓库中的 `examples/` 目录包含几个独立的 Lynx 项目。

| 项目 | 用途 |
| --- | --- |
| [healthy-shop](./examples/healthy-shop) | 通过全部检查，评分为 `100/100` |
| [threading-regressions](./examples/threading-regressions) | 包含用于演示的线程、生命周期和事件错误 |
| [event-mode-settings](./examples/event-mode-settings) | 包含配置和懒加载方面的警告 |

本地开发、文档站和示例验证请参考 [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md)。

## 许可证

[Apache License 2.0](./LICENSE)
