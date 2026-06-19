---
title: 生命周期
description: 说明为什么 ReactLynx 中不应使用 useLayoutEffect，以及布局读取应迁移到主线程事件或 ref。
---

# 生命周期

React DOM 的 `useLayoutEffect` 语义是“绘制前同步读取/调整布局”。ReactLynx 的生命周期在后台线程异步执行，因此不能提供同样保证。

普通副作用迁移到 `useEffect`：

```tsx
useEffect(() => {
  NativeModules.Analytics.track("mounted");
}, []);
```

必须在主线程读取布局时，使用 `main-thread:` 事件或 ref：

```tsx
function handleLayout(event: MainThread.LayoutChangeEvent) {
  "main thread";
  event.currentTarget.setStyleProperty("opacity", "1");
}

<view main-thread:bindlayoutchange={handleLayout} />;
```
