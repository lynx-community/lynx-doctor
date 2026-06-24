---
title: reactlynx rules
description: reactlynx rules sourced from the reactlynx-best-practices skill.
---

# reactlynx rules

The `reactlynx` category is sourced from the [`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices) skill and keeps thread, lifecycle, event, performance, and configuration assumptions explicit.

Current subcategories:

- `threading`: `reactlynx/background-only-api`
- `lifecycle`: `reactlynx/avoid-use-layout-effect`
- `events`: `reactlynx/main-thread-handler-directive`
- `configuration`: `reactlynx/global-props-event-mode`, `reactlynx/typescript-jsx-import-source`, `reactlynx/types-package-missing`
- `performance`: `reactlynx/lazy-without-suspense`

Example threading issue:

```tsx
export function App() {
  const analytics = lynx.getJSModule("Analytics");
  analytics.track("render");
  return <view />;
}
```

Move background-only work into a background context:

```tsx
export function App() {
  useEffect(() => {
    "background only";
    lynx.getJSModule("Analytics").track("mounted");
  }, []);

  return <view />;
}
```

Filter this category:

```bash
npx lynx-doctor@latest --category reactlynx --json
```
