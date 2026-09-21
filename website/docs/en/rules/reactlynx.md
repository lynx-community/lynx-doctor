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

## Analysis boundaries

Thread rules parse JavaScript/TypeScript and resolve local bindings. They recognize ReactLynx hook aliases, native event/ref callbacks, first-statement directives, background-only modules, and local helpers whose callers are all proven background contexts. Comments, strings, type positions, and shadowed globals do not count as API calls.

A main-thread handler imported from another file is not classified as missing a directive: cross-file bodies and dynamic callback factories are not resolved. Custom component callbacks need an explicit directive when their thread cannot be proven. Explicit React DOM imports are excluded from ReactLynx checks. Invalid source syntax stops the scan with a file location.

TypeScript checks use the effective JSONC configuration, including relative/package `extends` and multiple base configurations. Preserved JSX is supported for component libraries; automatic JSX requires `jsxImportSource: "@lynx-js/react"`. `verbatimModuleSyntax` also satisfies isolated module semantics. Missing or invalid base configurations stop the scan with an actionable error.

The TypeScript rules also reference the [`lynx-typescript` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-typescript/SKILL.md). All rule source metadata is pinned to the reviewed skills revision so reports and agent handoffs remain reproducible.
