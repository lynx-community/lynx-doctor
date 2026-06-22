---
title: Configuration Rules
description: Check TypeScript, globalPropsMode, and lazy/Suspense setup for project-level correctness.
---

# Configuration Rules

Configuration rules keep a project understandable to Lynx tooling and coding agents.

## TypeScript

Lynx projects using ReactLynx should configure:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@lynx-js/react",
    "isolatedModules": true
  }
}
```

Also declare `@lynx-js/types` for Lynx globals, events, NativeModules extension points, and custom element types.

## globalPropsMode

When Rspeedy uses `globalPropsMode: "event"`, components that directly read `lynx.__globalProps` no longer rely on root-level `forceUpdate` refreshes. Values that must respond to updates should subscribe through `useGlobalPropsChanged`.

## lazy and Suspense

`lazy()` components should have a nearby `Suspense` fallback. Important split bundles should also use an ErrorBoundary and review CSS bundle scope assumptions.
