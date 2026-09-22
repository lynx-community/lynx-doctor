---
"lynx-doctor": patch
---

Continue scanning other files when a JavaScript, TypeScript, or checked CSS file cannot be parsed. Report each failure with its path, line, column, and parser message in text and JSON output, exclude the file from checked coverage, and include parse failures in agent handoff and verification. Incomplete scans keep a failing exit status even with `--blocking none` and show `N/A` in score-only output instead of a misleading healthy score.
