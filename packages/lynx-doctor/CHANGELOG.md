# lynx-doctor

## 0.1.1

### Patch Changes

- a3ca78e: Skip binary and non-UTF-8 files before source parsing so compiled Lynx bundles such as `www/a2ui.lynx.js` no longer abort a scan. Full, diff, and staged scans inspect the selected file contents, exclude skipped files from scan coverage, and report their paths as notices. Text `.lynx.js` files remain eligible for source checks.

## 0.1.0

### Minor Changes

- 5ea4945: Add opt-in CSS backend/engine compatibility checks using pinned Lynx CSS data, with explicit unknown and skipped coverage reporting.
- db92cd9: Add native element/event guidance and component library entry checks, with explicit artifact validation through --package and binding-aware lynx-ui Button diagnostics.
- a4e647a: Make installation non-destructive and version-pinned, generate project-aware CI, resolve standalone typed configs, and verify agent changes before determining the final CLI exit status. Expose scan scope and keep empty scans from claiming complete source health.

### Patch Changes

- 3e2a4bd: Scan local and untracked changes alongside branch changes, read staged sources from the Git index, and consistently apply ignores and package boundaries. Invalid Git contexts now report an actionable error.
- 568efcd: Resolve thread diagnostics from syntax and lexical bindings, honor inherited TypeScript configuration, and pin skill provenance to a reviewed revision.

## 0.0.2

### Patch Changes

- d54d5ef: Improve the agent handoff workflow with an arrow-key interactive menu after scans, non-interactive Codex and Claude launches, and prompt fallback when an agent command fails.
