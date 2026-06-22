---
title: 规则概览
description: Lynx Doctor 内置规则概览，覆盖 Lynx 线程边界、生命周期、事件、性能和配置问题。
---

# 规则概览

Lynx Doctor 规则来自 Lynx 官方文档和社区 skills 的可执行化整理。当前内置规则覆盖：

- `reactlynx/background-only-api`
- `reactlynx/avoid-use-layout-effect`
- `reactlynx/main-thread-handler-directive`
- `reactlynx/global-props-event-mode`
- `reactlynx/lazy-without-suspense`
- `reactlynx/typescript-jsx-import-source`
- `reactlynx/types-package-missing`

查看本地规则：

```bash
npx lynx-doctor@latest rules list
```

解释单条规则：

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```
