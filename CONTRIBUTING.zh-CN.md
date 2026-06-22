# 贡献指南

<p align="center">
  <a href="./CONTRIBUTING.md">English</a>
  ·
  <a href="./README.zh-CN.md">README 中文</a>
</p>

感谢你改进 Lynx Doctor。本指南说明本地开发、文档站、示例项目和提交前验证流程。

## 环境要求

- Node.js >= 20.19.0
- pnpm >= 10

安装 workspace 依赖：

```bash
pnpm install
```

## 目录结构

```text
packages/lynx-doctor   CLI 和 Node API
website/               Rspress 文档站
examples/              独立的 Lynx 示例项目
```

## 开发命令

构建全部项目：

```bash
pnpm build
```

类型检查：

```bash
pnpm typecheck
```

运行测试：

```bash
pnpm test
```

运行完整本地检查：

```bash
pnpm check
```

开发 CLI package 时使用 watch 构建：

```bash
pnpm --filter lynx-doctor dev
```

## 文档站

文档站基于 Rspress，包含英文和中文内容。英文是默认语言，路径为 `/`；中文路径为 `/zh/`。

启动文档站：

```bash
pnpm docs:dev
```

构建文档站：

```bash
pnpm docs:build
```

## 示例项目

`examples/` 目录包含独立的 Lynx 项目。它们刻意不放进根 workspace，这样可以单独安装和运行。

使用本地 CLI 扫描示例：

```bash
pnpm build
node packages/lynx-doctor/dist/cli.js examples/healthy-shop --verbose --blocking none
node packages/lynx-doctor/dist/cli.js examples/threading-regressions --agent-prompt --blocking none
node packages/lynx-doctor/dist/cli.js examples/event-mode-settings --verbose --blocking none
```

使用 Rspeedy 安装并运行一个示例：

```bash
cd examples/healthy-shop
pnpm install
pnpm dev
```

安装示例依赖后，可以逐个构建：

```bash
pnpm --dir examples/healthy-shop build
pnpm --dir examples/threading-regressions build
pnpm --dir examples/event-mode-settings build
```

## 提交前检查

运行：

```bash
pnpm check
```

如果只改文档，也建议运行：

```bash
pnpm docs:build
```

如果改了示例项目，请运行对应示例的 build，并用 Lynx Doctor 重新扫描该示例。
