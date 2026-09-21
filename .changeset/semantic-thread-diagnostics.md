---
"lynx-doctor": patch
---

Reduce false positives in thread diagnostics and honor inherited TypeScript settings.

- Resolve imported aliases and locally shadowed bindings when checking thread-sensitive APIs and handlers.
- Recognize background-only modules, effects, and explicit thread directives while keeping unresolved handler contexts unknown.
- Read JSONC and inherited `tsconfig` settings through TypeScript, including package-based and multiple `extends` entries and Windows paths.
- Accept supported JSX-preservation configurations and pin diagnostic skill references to a reviewed revision.
