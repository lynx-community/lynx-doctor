---
title: reactlynx rules
description: reactlynx rules sourced from the reactlynx-best-practices skill.
---

# reactlynx rules

The `reactlynx` category is sourced from the [`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices) skill and keeps thread, lifecycle, event, performance, and configuration assumptions explicit.

Current subcategories:

- `threading`: `reactlynx/background-only-api`
- `lifecycle`: `reactlynx/avoid-use-layout-effect`
- `events`: `reactlynx/main-thread-handler-directive`, `reactlynx/native-element-events`
- `configuration`: `reactlynx/global-props-event-mode`, `reactlynx/typescript-jsx-import-source`, `reactlynx/types-package-missing`
- `elements`: `reactlynx/no-dom-elements`
- `packaging`: `reactlynx/library-runtime-entry`, `reactlynx/library-missing-artifact`
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

## Native elements and events

`reactlynx/no-dom-elements` warns about common Web tags such as `div`, `span`, and `img` in Lynx source. Prefer `view`, `text`, and `image`. Unknown custom native tags are left alone; disable this warning for a host that deliberately registers a Web-named element.

`reactlynx/native-element-events` catches Web click/touch props on known native elements. Use `<view bindtap={onTap}>` rather than `<view onClick={onTap}>`. Custom components keep their own contracts: a lynx-ui `Button` uses `onClick`. Button checks resolve import aliases and multiline JSX without matching similarly named local components.

These checks draw on the [`lynx-api-docs` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-api-docs/SKILL.md).

## Component library entries

Packages with both an `@lynx-js/react` peer dependency and public package entries receive `reactlynx/library-runtime-entry` warnings when normal runtime entries expose raw TS/TSX. Application entry projects are excluded. Explicit source conditions and `jsnext:source` are allowed.

After building a component library, run:

```bash
lynx-doctor --package
```

`reactlynx/library-missing-artifact` checks that literal `main`, `module`, `types`/`typings`, and `exports` import/require/default/types paths exist inside the package. For example, an export ending in `.js` is wrong when the build actually emits `.jsx`. Normal scans do not require built files.

`--package` reads working-tree artifacts and cannot be combined with diff/staged scans. Wildcard entries, fallback arrays, and custom conditions are not fully resolved. It does not build the package, execute lifecycle scripts, verify tarball inclusion, or infer JSX preservation from factory calls. Inspect the packed output and run a consumer build before publishing, following the [component-library-packaging skill rule](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/reactlynx-best-practices/rules/component-library-packaging.md).
