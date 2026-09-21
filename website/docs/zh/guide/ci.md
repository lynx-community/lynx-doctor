---
title: CI 设置
description: 把 Lynx Doctor 接入 GitHub Actions，在 Pull Request 中自动检查代码变更。
---

# CI 设置

运行安装命令：

```bash
npx lynx-doctor@latest install
```

该命令会在项目中添加：

- GitHub Actions 工作流：`.github/workflows/lynx-doctor.yml`
- 命令脚本：`package.json` 中的 `doctor` 脚本
- Agent 使用说明：`.agents/lynx-doctor.md`

默认工作流会在 Pull Request 中检查有改动的文件。发现错误或警告时，检查都会失败：

```bash
npx lynx-doctor@latest --diff --blocking warning
```

如果希望只在出现错误时让检查失败，将工作流中的命令改为：

```bash
npx lynx-doctor@latest --diff --blocking error
```

如需先观察检查结果，可暂时关闭对错误和警告的阻断：

```bash
npx lynx-doctor@latest --diff --blocking none
```
