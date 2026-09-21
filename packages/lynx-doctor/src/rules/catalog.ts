import type { RuleDefinition, RuleSource } from "../core/types.js";

const SKILLS_REPO = "lynx-community/skills";
const SKILLS_REF = "715f74063c53ec3d50e68b28b90e163b33cbc6b6";

const sourceFromSkill = (
  skill: "reactlynx-best-practices" | "lynx-ui" | "rspeedy-bundle-size" | "lynx-typescript" | "lynx-check-css-support" | "lynx-api-docs",
  protocol: "frontmatter-rules" | "reference-routing" | "component-api" | "bundle-size-reference",
  docsPath: string,
  supportingPaths: readonly string[] = ["SKILL.md"],
): RuleSource => ({
  kind: "skill",
  repo: SKILLS_REPO,
  ref: SKILLS_REF,
  skill,
  protocol,
  entrypoint: "SKILL.md",
  docsPath,
  rawUrl: `https://raw.githubusercontent.com/${SKILLS_REPO}/${SKILLS_REF}/skills/${skill}/${docsPath}`,
  webUrl: `https://github.com/${SKILLS_REPO}/blob/${SKILLS_REF}/skills/${skill}/${docsPath}`,
  supportingPaths
});

const defineRule = (
  rule: Omit<RuleDefinition, "docsUrl"> & { readonly docsUrl?: string },
): RuleDefinition => ({
  ...rule,
  docsUrl: rule.docsUrl ?? rule.source.rawUrl
});

export const RULES: readonly RuleDefinition[] = [
  defineRule({
    id: "reactlynx/no-dom-elements",
    title: "Web element used in Lynx source",
    category: "reactlynx",
    subcategory: "elements",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects common Web tags in Lynx source without rejecting unknown custom native elements.",
    why: "Web element contracts and application build assumptions do not automatically transfer to native Lynx components or reusable packages.",
    fix: "Use Lynx view, text, image, or list elements, or verify the host registers the custom element.",
    source: sourceFromSkill("lynx-api-docs", "reference-routing", "lynx-vs-web/migration-guide.md"),
    tags: ["elements", "integration"]
  }),
  defineRule({
    id: "reactlynx/native-element-events",
    title: "Native Lynx element uses a Web event prop",
    category: "reactlynx",
    subcategory: "events",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks Web click/touch props on known native Lynx elements.",
    why: "Web element contracts and application build assumptions do not automatically transfer to native Lynx components or reusable packages.",
    fix: "Use the matching bind*/catch* event on native elements. Component props such as Button.onClick follow their own API.",
    source: sourceFromSkill("lynx-api-docs", "reference-routing", "elements/view.md"),
    tags: ["events", "integration"]
  }),
  defineRule({
    id: "reactlynx/library-runtime-entry",
    title: "Component library exposes raw TypeScript as a runtime entry",
    category: "reactlynx",
    subcategory: "packaging",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Checks universal runtime entries of packages declaring a ReactLynx peer dependency.",
    why: "Web element contracts and application build assumptions do not automatically transfer to native Lynx components or reusable packages.",
    fix: "Publish emitted ESM with preserved JSX and matching declarations. Keep source behind an explicit source field or condition.",
    source: sourceFromSkill("reactlynx-best-practices", "reference-routing", "rules/component-library-packaging.md"),
    tags: ["packaging", "integration"]
  }),
  defineRule({
    id: "reactlynx/library-missing-artifact",
    title: "Component library entry does not match a built file",
    category: "reactlynx",
    subcategory: "packaging",
    defaultSeverity: "error",
    impact: "medium",
    summary: "With --package, checks that literal runtime and type entries point to existing package-local files.",
    why: "Web element contracts and application build assumptions do not automatically transfer to native Lynx components or reusable packages.",
    fix: "Build the library first, align exports with emitted .js/.jsx and declaration paths, then validate the packed package in a consumer.",
    source: sourceFromSkill("reactlynx-best-practices", "reference-routing", "rules/component-library-packaging.md"),
    tags: ["packaging", "integration"]
  }),
  defineRule({
    id: "lynx-css/unsupported",
    title: "CSS is unsupported on a target backend",
    category: "lynx-css",
    subcategory: "compatibility",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks explicit backend incompatibility for CSS properties and known literal features.",
    why: "CSS support differs by rendering backend and Lynx engine version.",
    fix: "Replace this property/value with a supported alternative or narrow the configured targets.",
    source: sourceFromSkill("lynx-check-css-support", "reference-routing", "SKILL.md"),
    tags: ["css", "compatibility", "platform", "engine-version"]
  }),
  defineRule({
    id: "lynx-css/requires-newer-version",
    title: "CSS requires a newer Lynx engine",
    category: "lynx-css",
    subcategory: "compatibility",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Compares CSS compatibility minima against each configured Lynx engine target.",
    why: "CSS support differs by rendering backend and Lynx engine version.",
    fix: "Use an alternative supported by the minimum target, or raise the minimum engine version after verifying host support.",
    source: sourceFromSkill("lynx-check-css-support", "reference-routing", "SKILL.md"),
    tags: ["css", "compatibility", "platform", "engine-version"]
  }),
  defineRule({
    id: "lynx-css/conditional-support",
    title: "CSS support is conditional or partial",
    category: "lynx-css",
    subcategory: "compatibility",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Preserves conditional requirements and partial implementation notes from the compatibility dataset.",
    why: "CSS support differs by rendering backend and Lynx engine version.",
    fix: "Review the reported condition or partial implementation notes and verify the feature on the target runtime.",
    source: sourceFromSkill("lynx-check-css-support", "reference-routing", "SKILL.md"),
    tags: ["css", "compatibility", "platform", "engine-version"]
  }),
  defineRule({
    id: "reactlynx/background-only-api",
    title: "Background-only API used from shared or render code",
    category: "reactlynx",
    subcategory: "threading",
    defaultSeverity: "error",
    impact: "critical",
    summary: "Detects lynx.getJSModule and NativeModules calls outside an obvious background context.",
    why:
      "ReactLynx can evaluate initial render code on the main thread. Background-only APIs may not exist there and can fail at runtime.",
    fix:
      "Move the call into useEffect, an event handler, a ref callback, or a function whose first statement is 'background only'.",
    source: sourceFromSkill("reactlynx-best-practices", "frontmatter-rules", "rules/detect-background-only.md"),
    tags: ["threading", "dual-thread", "background-only", "native-modules"]
  }),
  defineRule({
    id: "reactlynx/avoid-use-layout-effect",
    title: "Avoid useLayoutEffect in ReactLynx",
    category: "reactlynx",
    subcategory: "lifecycle",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Flags useLayoutEffect, which does not provide React DOM style synchronous layout behavior in ReactLynx.",
    why:
      "ReactLynx lifecycle work runs asynchronously on the background thread, so useLayoutEffect is unsupported and misleading.",
    fix:
      "Use useEffect for background side effects, or main-thread: layout events / refs when layout must be read on the main thread.",
    source: sourceFromSkill("reactlynx-best-practices", "frontmatter-rules", "rules/avoid-use-layout-effect.md"),
    tags: ["lifecycle", "layout", "dual-thread"]
  }),
  defineRule({
    id: "reactlynx/main-thread-handler-directive",
    title: "main-thread handler is missing a directive",
    category: "reactlynx",
    subcategory: "events",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks that main-thread:* event handlers point at functions with a top-level 'main thread' directive.",
    why:
      "Main-thread scripts run synchronously for gestures and animations. Without the directive, the handler is not a valid main-thread function.",
    fix:
      "Add 'main thread' as the first statement of the handler, or remove the main-thread: prefix and keep the work on the background thread.",
    source: sourceFromSkill("reactlynx-best-practices", "frontmatter-rules", "rules/main-thread-scripts-guide.md"),
    tags: ["events", "main-thread", "gesture"]
  }),
  defineRule({
    id: "reactlynx/global-props-event-mode",
    title: "Direct lynx.__globalProps read under event mode",
    category: "reactlynx",
    subcategory: "configuration",
    defaultSeverity: "warning",
    impact: "medium",
    summary:
      "Warns when globalPropsMode is set to event while code reads lynx.__globalProps directly without useGlobalPropsChanged.",
    why:
      "In event mode, UpdateGlobalProps no longer drives a root React update. Direct reads can become stale unless code subscribes explicitly.",
    fix:
      "Use useGlobalPropsChanged to update state, context, or a store when host global props change.",
    source: sourceFromSkill("reactlynx-best-practices", "frontmatter-rules", "rules/global-props-mode.md"),
    tags: ["configuration", "rspeedy", "global-props"]
  }),
  defineRule({
    id: "reactlynx/lazy-without-suspense",
    title: "lazy() used without Suspense",
    category: "reactlynx",
    subcategory: "performance",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects lazy component loading without an obvious Suspense boundary in the same file.",
    why:
      "Lazy Lynx bundles load asynchronously and need a nearby lightweight fallback. CSS scope and error handling should be reviewed too.",
    fix:
      "Wrap lazy content in Suspense with a small fallback, and add an ErrorBoundary for important chunks.",
    source: sourceFromSkill("reactlynx-best-practices", "frontmatter-rules", "rules/code-splitting.md"),
    tags: ["performance", "lazy", "suspense", "bundle"]
  }),
  defineRule({
    id: "reactlynx/typescript-jsx-import-source",
    title: "ReactLynx TypeScript JSX settings are incomplete",
    category: "reactlynx",
    subcategory: "configuration",
    defaultSeverity: "error",
    impact: "medium",
    summary: "Checks inherited TypeScript options, including JSX preservation/runtime and isolated module semantics.",
    why:
      "ReactLynx JSX and Rspeedy transpilation need the Lynx JSX runtime and isolated module semantics for reliable type checking.",
    fix:
      "Use jsx: preserve for a library that preserves JSX, or react-jsx/react-jsxdev with jsxImportSource: @lynx-js/react; enable isolatedModules or verbatimModuleSyntax.",
    source: sourceFromSkill("lynx-typescript", "reference-routing", "SKILL.md"),
    tags: ["configuration", "typescript", "jsx", "rspeedy"]
  }),
  defineRule({
    id: "reactlynx/types-package-missing",
    title: "Lynx type package is missing",
    category: "reactlynx",
    subcategory: "configuration",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Warns when a ReactLynx package does not declare @lynx-js/types.",
    why:
      "The core Lynx type package provides globals, events, NativeModules extension points, and intrinsic element types.",
    fix:
      "Install @lynx-js/types alongside @lynx-js/react and keep duplicate/conflicting Lynx type packages out of the project.",
    source: sourceFromSkill("lynx-typescript", "reference-routing", "SKILL.md"),
    tags: ["configuration", "typescript", "types"]
  }),
  defineRule({
    id: "lynx-ui/prefer-public-aggregate-import",
    title: "Prefer the public lynx-ui aggregate import",
    category: "lynx-ui",
    subcategory: "imports",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Warns when code imports directly from @lynx-js/lynx-ui-* component packages.",
    why:
      "The lynx-ui skill routes general usage through the public @lynx-js/lynx-ui entry, with package-specific imports reserved for explicit package boundaries.",
    fix:
      "Import components from @lynx-js/lynx-ui unless the component API reference requires a package-specific import.",
    source: sourceFromSkill("lynx-ui", "reference-routing", "references/foundation.md"),
    tags: ["imports", "lynx-ui", "component-api"]
  }),
  defineRule({
    id: "lynx-ui/button-uses-on-click",
    title: "lynx-ui Button should use onClick",
    category: "lynx-ui",
    subcategory: "component-api",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects lynx-ui Button usage with native bind*/catch* tap handlers instead of the documented onClick prop.",
    why:
      "The Button API exposes onClick and render-prop state. Native event attributes bypass the documented component contract and are easier to break when the component changes.",
    fix:
      "Use Button's onClick prop and keep native event attributes inside buttonProps only when the API reference calls for it.",
    source: sourceFromSkill("lynx-ui", "component-api", "references/components/button/api.md", [
      "SKILL.md",
      "references/component-overview.md",
      "references/components/button/guide.md"
    ]),
    tags: ["button", "events", "component-api"]
  }),
  defineRule({
    id: "lynx-ui/gesture-components-enable-new-gesture",
    title: "Gesture-heavy lynx-ui components need enableNewGesture",
    category: "lynx-ui",
    subcategory: "gestures",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Warns when gesture-driven lynx-ui components are used without enableNewGesture: true in ReactLynx config.",
    why:
      "The lynx-ui foundation reference calls out enableNewGesture for gesture-dependent usage. Missing it can leave drag, swipe, sheet, and slider interactions unreliable.",
    fix:
      "Set pluginReactLynx({ enableNewGesture: true }) in the Lynx/Rspeedy config that builds this app.",
    source: sourceFromSkill("lynx-ui", "reference-routing", "references/foundation.md", [
      "SKILL.md",
      "references/component-overview.md"
    ]),
    tags: ["configuration", "gestures", "lynx-ui"]
  }),
  defineRule({
    id: "rspeedy/no-export-star-barrels",
    title: "Avoid export-star barrels in rspeedy bundle paths",
    category: "rspeedy",
    subcategory: "bundle-size",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects export-star barrel files that can defeat tree-shaking and pull extra code into rspeedy bundles.",
    why:
      "The rspeedy bundle-size skill calls out export-star barrels as a structural tree-shaking risk, especially in workspace libraries.",
    fix:
      "Replace export-star barrels with explicit exports or import directly from the feature module that is actually needed.",
    source: sourceFromSkill("rspeedy-bundle-size", "bundle-size-reference", "references/three-levers.md", [
      "SKILL.md"
    ]),
    tags: ["bundle-size", "tree-shaking", "barrels"]
  }),
  defineRule({
    id: "rspeedy/no-eval-in-bundle-code",
    title: "Avoid eval in rspeedy bundle code",
    category: "rspeedy",
    subcategory: "bundle-size",
    defaultSeverity: "warning",
    impact: "medium",
    summary: "Detects eval() in source files because it can poison production name mangling in bundled output.",
    why:
      "The rspeedy bundle-size skill identifies eval poisoning as a distinct cause of readable, poorly mangled production chunks.",
    fix:
      "Remove eval, isolate the dependency behind an alias or shim, or prove with a measured build that it does not affect the production chunk.",
    source: sourceFromSkill("rspeedy-bundle-size", "bundle-size-reference", "references/three-levers.md", [
      "SKILL.md"
    ]),
    tags: ["bundle-size", "mangle", "eval"]
  })
];

export const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]));
