---
"lynx-doctor": minor
---

Add opt-in CSS compatibility checks for rendering backends and minimum Lynx engine versions.

- Configure engine versions with `targets`, for example `targets: { android: "3.5", ios: "3.6" }`.
- Check `.css` declarations and supported literal feature keys against pinned Lynx CSS data, reporting unsupported features, minimum-version requirements, and conditional support.
- Expose checked targets, data version, and unknown comparisons in `cssCoverage`. Missing data remains unknown, and scans without targets explicitly report that CSS compatibility checks were skipped.

Targets refer to Lynx engine versions, independently of the ReactLynx npm package version. Inline and dynamic styles are outside this initial coverage.
