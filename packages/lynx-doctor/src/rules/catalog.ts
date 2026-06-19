import type { RuleDefinition } from "../core/types.js";

export const RULES: readonly RuleDefinition[] = [
  {
    id: "reactlynx/background-only-api",
    title: "Background-only API used from shared or render code",
    category: "Threading",
    defaultSeverity: "error",
    impact: "critical",
    summary: "Detects lynx.getJSModule and NativeModules calls outside an obvious background context.",
    why:
      "ReactLynx can evaluate initial render code on the main thread. Background-only APIs may not exist there and can fail at runtime.",
    fix:
      "Move the call into useEffect, an event handler, a ref callback, or a function whose first statement is 'background only'.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/reactlynx-best-practices/rules/detect-background-only.md",
    tags: ["dual-thread", "background-only", "native-modules"]
  },
  {
    id: "reactlynx/avoid-use-layout-effect",
    title: "Avoid useLayoutEffect in ReactLynx",
    category: "Lifecycle",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Flags useLayoutEffect, which does not provide React DOM style synchronous layout behavior in ReactLynx.",
    why:
      "ReactLynx lifecycle work runs asynchronously on the background thread, so useLayoutEffect is unsupported and misleading.",
    fix:
      "Use useEffect for background side effects, or main-thread: layout events / refs when layout must be read on the main thread.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/reactlynx-best-practices/rules/avoid-use-layout-effect.md",
    tags: ["lifecycle", "layout", "dual-thread"]
  },
  {
    id: "reactlynx/main-thread-handler-directive",
    title: "main-thread handler is missing a directive",
    category: "Events",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks that main-thread:* event handlers point at functions with a top-level 'main thread' directive.",
    why:
      "Main-thread scripts run synchronously for gestures and animations. Without the directive, the handler is not a valid main-thread function.",
    fix:
      "Add 'main thread' as the first statement of the handler, or remove the main-thread: prefix and keep the work on the background thread.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/reactlynx-best-practices/rules/main-thread-scripts-guide.md",
    tags: ["main-thread", "events", "gesture"]
  },
  {
    id: "reactlynx/global-props-event-mode",
    title: "Direct lynx.__globalProps read under event mode",
    category: "Configuration",
    defaultSeverity: "warning",
    impact: "medium",
    summary:
      "Warns when globalPropsMode is set to event while code reads lynx.__globalProps directly without useGlobalPropsChanged.",
    why:
      "In event mode, UpdateGlobalProps no longer drives a root React update. Direct reads can become stale unless code subscribes explicitly.",
    fix:
      "Use useGlobalPropsChanged to update state, context, or a store when host global props change.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/reactlynx-best-practices/rules/global-props-mode.md",
    tags: ["rspeedy", "global-props", "configuration"]
  },
  {
    id: "reactlynx/lazy-without-suspense",
    title: "lazy() used without Suspense",
    category: "Performance",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects lazy component loading without an obvious Suspense boundary in the same file.",
    why:
      "Lazy Lynx bundles load asynchronously and need a nearby lightweight fallback. CSS scope and error handling should be reviewed too.",
    fix:
      "Wrap lazy content in Suspense with a small fallback, and add an ErrorBoundary for important chunks.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/reactlynx-best-practices/rules/code-splitting.md",
    tags: ["lazy", "suspense", "bundle"]
  },
  {
    id: "reactlynx/typescript-jsx-import-source",
    title: "ReactLynx TypeScript JSX settings are incomplete",
    category: "Configuration",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks tsconfig.json for jsxImportSource and isolatedModules settings expected by ReactLynx/Rspeedy.",
    why:
      "ReactLynx JSX and Rspeedy transpilation need the Lynx JSX runtime and isolated module semantics for reliable type checking.",
    fix:
      "Set compilerOptions.jsx to react-jsx, compilerOptions.jsxImportSource to @lynx-js/react, and isolatedModules to true.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/lynx-typescript/SKILL.md",
    tags: ["typescript", "jsx", "rspeedy"]
  },
  {
    id: "reactlynx/types-package-missing",
    title: "Lynx type package is missing",
    category: "Configuration",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Warns when a ReactLynx package does not declare @lynx-js/types.",
    why:
      "The core Lynx type package provides globals, events, NativeModules extension points, and intrinsic element types.",
    fix:
      "Install @lynx-js/types alongside @lynx-js/react and keep duplicate/conflicting Lynx type packages out of the project.",
    docsUrl:
      "https://raw.githubusercontent.com/lynx-community/skills/release/skills/lynx-typescript/SKILL.md",
    tags: ["typescript", "types"]
  }
];

export const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]));
