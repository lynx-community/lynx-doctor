---
title: Threading
description: Lynx threading rules that keep background-only Native APIs out of render and shared main-thread code paths.
---

# Threading

ReactLynx may execute initial component render on the main thread while the full React runtime runs on the background thread. Background-only APIs such as `lynx.getJSModule` and `NativeModules` should not appear in render or shared code paths.

Incorrect:

```tsx
export function App() {
  const analytics = lynx.getJSModule("Analytics");
  analytics.track("render");
  return <view />;
}
```

Recommended:

```tsx
export function App() {
  useEffect(() => {
    "background only";
    lynx.getJSModule("Analytics").track("mounted");
  }, []);

  return <view />;
}
```

When a handler passes through custom component props before reaching `bindtap`, add `'background only'` explicitly so the thread boundary is clear to people and tools.
