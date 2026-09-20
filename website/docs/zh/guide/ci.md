---
title: CI 设置
description: 把 Lynx Doctor 接入 GitHub Actions，固定检查版本并保留团队已有配置，在 Pull Request 中自动检查代码变更。
---

# CI 设置

预览或应用配置：

```bash
npx lynx-doctor@latest install --dry-run
npx lynx-doctor@latest install
npm run doctor
```

该命令会在项目中添加：

- GitHub Actions 工作流：`.github/workflows/lynx-doctor.yml`
- 命令脚本：`package.json` 中的 `doctor` 脚本
- Agent 使用说明：`.agents/lynx-doctor.md`

`doctor` 脚本使用 `npx --yes`，并固定到当前运行的 Doctor 版本，无需先添加本地 devDependency。已有脚本、工作流和 Agent 说明均原样保留，`--yes` 也不会覆盖。重复安装不会产生额外改动。升级已有固定版本命令时，请审查并显式编辑对应文件。

Monorepo 中从应用包目录运行安装器：workflow 写到 Git 根目录，存在根 workspace 时在根目录安装依赖，再进入选定应用目录扫描。依赖步骤识别 pnpm、Yarn、npm 和 Bun 锁文件。仓库根目录没有 package.json 时，会安装所选应用的依赖。启用前请核对项目特有的 workspace 初始化步骤。

PR 扫描比较真实 PR base commit，并检出 PR head；推送 `main` 和手动触发时扫描整个项目。workflow 只申请仓库只读权限，不保留 checkout 凭据，并安装项目依赖以解析继承的 TypeScript 配置。它不发表评论，也不启动 coding agent。

默认工作流在发现错误或警告时都会失败。逐步接入时可把阻断级别改为 `error` 或 `none`：

```bash
npm run doctor -- --diff origin/main --blocking error
npm run doctor -- --blocking none
```

生成的 workflow 和脚本固定 Doctor 版本；规则来源提交和 CSS 兼容性数据另行固定。CSS 检查需要显式配置引擎 `targets`；组件库产物检查需要先构建再运行 `--package`。
