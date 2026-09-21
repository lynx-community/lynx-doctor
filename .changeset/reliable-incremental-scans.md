---
"lynx-doctor": patch
---

Make incremental scans follow the selected Git snapshot and project boundaries.

- Include branch, staged, unstaged, and untracked changes in `--diff [base]` scans.
- Read staged source contents from the Git index, so unstaged edits cannot hide a problem in the snapshot being checked.
- Apply file ignores and package boundaries consistently across full, diff, and staged scans, including paths containing spaces.
- Report actionable errors for invalid Git contexts, base references, and incompatible scan modes.
