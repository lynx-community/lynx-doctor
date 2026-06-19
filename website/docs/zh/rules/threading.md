---
title: 线程边界
description: 解释 ReactLynx 双线程规则，避免在 render 或共享代码中调用 background-only Native API。
---

# 线程边界

ReactLynx 初始渲染可能在主线程执行组件 render，而完整 React runtime 在后台线程运行。因此 `lynx.getJSModule` 和 `NativeModules` 这类 background-only API 不应该出现在 render 或共享代码路径里。

错误模式：

```tsx
export function App() {
  const analytics = lynx.getJSModule("Analytics");
  analytics.track("render");
  return <view />;
}
```

推荐模式：

```tsx
export function App() {
  useEffect(() => {
    "background only";
    lynx.getJSModule("Analytics").track("mounted");
  }, []);

  return <view />;
}
```

当 handler 通过自定义组件 props 传递后才落到 `bindtap`，建议显式添加 `'background only'`，让线程边界对人和工具都清晰。
