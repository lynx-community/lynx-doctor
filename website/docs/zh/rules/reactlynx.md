---
title: reactlynx 规则
description: 源自 reactlynx-best-practices skill 的 reactlynx 规则。
---

# reactlynx 规则

`reactlynx` 一级分类源自 [`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices) skill，用来显式检查线程、生命周期、事件、性能和项目配置假设。

当前二级分类：

- `threading`：`reactlynx/background-only-api`
- `lifecycle`：`reactlynx/avoid-use-layout-effect`
- `events`：`reactlynx/main-thread-handler-directive`
- `configuration`：`reactlynx/global-props-event-mode`、`reactlynx/typescript-jsx-import-source`、`reactlynx/types-package-missing`
- `performance`：`reactlynx/lazy-without-suspense`

典型线程问题：

```tsx
export function App() {
  const analytics = lynx.getJSModule("Analytics");
  analytics.track("render");
  return <view />;
}
```

推荐把 background-only 工作移到后台上下文：

```tsx
export function App() {
  useEffect(() => {
    "background only";
    lynx.getJSModule("Analytics").track("mounted");
  }, []);

  return <view />;
}
```

过滤这个分类：

```bash
npx lynx-doctor@latest --category reactlynx --json
```
