---
title: Lifecycle
description: Why ReactLynx code should avoid useLayoutEffect and move layout reads to main-thread events or refs.
---

# Lifecycle

In React DOM, `useLayoutEffect` means “read or adjust layout synchronously before paint.” ReactLynx lifecycle work runs asynchronously on the background thread, so it cannot provide that guarantee.

Move ordinary side effects to `useEffect`:

```tsx
useEffect(() => {
  NativeModules.Analytics.track("mounted");
}, []);
```

When layout must be read on the main thread, use `main-thread:` events or refs:

```tsx
function handleLayout(event: MainThread.LayoutChangeEvent) {
  "main thread";
  event.currentTarget.setStyleProperty("opacity", "1");
}

<view main-thread:bindlayoutchange={handleLayout} />;
```
