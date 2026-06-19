---
title: CI 设置
description: 使用 install 命令把 Lynx Doctor 加入 GitHub Actions，在每个 pull request 上扫描新增问题。
---

# CI 设置

运行安装命令：

```bash
npx lynx-doctor@latest install
```

它会写入：

- `.github/workflows/lynx-doctor.yml`
- `package.json` 的 `doctor` script
- `.agents/lynx-doctor.md`

默认 workflow 会在 pull request 上运行 diff 扫描：

```bash
npx lynx-doctor@latest --diff --blocking warning
```

如果团队还没有准备好阻塞 warning，可以把 workflow 中的 blocking 改成：

```bash
npx lynx-doctor@latest --diff --blocking error
```

或者只做观察：

```bash
npx lynx-doctor@latest --diff --blocking none
```
