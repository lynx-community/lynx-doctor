---
title: CSS compatibility
description: Check CSS against explicit rendering backends and minimum Lynx engine versions.
---

# CSS compatibility

The `lynx-css` category applies the [`lynx-check-css-support` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-check-css-support/SKILL.md) using the exact `@lynx-js/css-defines@0.0.16` dataset. Scanning does not fetch newer data or run skill commands.

Configure your minimum **Lynx engine versions**, independently of the ReactLynx npm package version:

```json
{
  "targets": { "android": "3.5", "ios": "3.6" }
}
```

Save this in `lynx-doctor.config.json`. Supported backends are `android`, `ios`, `harmony`, `clay_android`, `clay_ios`, `clay_macos`, `clay_windows`, and `web_lynx`. Values are numeric version strings, for example `"3.6"` or `"3.6.1"`.

```css
.card {
  filter: brightness(0.5);
}
```

With those targets, this reports that `filter.brightness` requires Android Lynx 3.6. It passes the iOS 3.6 check.

| Rule | Default | Evidence |
| --- | --- | --- |
| `lynx-css/unsupported` | error | Data explicitly sets support to `false` |
| `lynx-css/requires-newer-version` | error | The target is below a numeric minimum |
| `lynx-css/conditional-support` | warning | Partial support or a condition such as `targetSdkVersion` |

Missing properties, absent backend data, and `null` support remain **unknown**. They do not become compatibility errors or proof of support. JSON reports include `cssCoverage` with targets, dataset version, file/declaration counts, and unknown comparison counts. Text reports show unknown or unconfigured coverage notices. Without targets, CSS compatibility checks are skipped.

The initial scope is `.css` declarations, base property support, and literal keywords/functions that directly match published feature keys. Custom properties, variables, inline/dynamic styles, grouped feature names, selector support, cascade fallbacks, and preprocessor sources are not fully evaluated. Every declaration is checked independently, including declarations inside conditional rules. Use file ignores for styles that target a different runtime, or override rule severity when compatibility is handled outside these checks. These results describe declared support, not complete runtime behavior.

Full, diff, and staged scans share the same ignore rules. Staged CSS is read from Git's index; configuration still comes from the working tree.
