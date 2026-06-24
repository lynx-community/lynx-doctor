---
title: rspeedy rules
description: rspeedy bundle-size rules sourced from the rspeedy-bundle-size skill.
---

# rspeedy rules

The `rspeedy` category is sourced from the [`rspeedy-bundle-size`](https://github.com/lynx-community/skills/tree/release/skills/rspeedy-bundle-size) skill. These rules focus on shipped bundle bytes rather than runtime performance.

Current subcategories:

- `bundle-size`: `rspeedy/no-export-star-barrels`, `rspeedy/no-eval-in-bundle-code`

The first checks come from the skill's three-lever bundle-size reference: avoid structural tree-shaking blockers such as export-star barrels, and flag `eval()` because it can poison production name mangling.

Filter this category:

```bash
npx lynx-doctor@latest --category rspeedy --json
```
