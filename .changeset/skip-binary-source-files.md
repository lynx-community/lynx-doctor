---
"lynx-doctor": patch
---

Skip binary and non-UTF-8 files before source parsing so compiled Lynx bundles such as `www/a2ui.lynx.js` no longer abort a scan. Full, diff, and staged scans inspect the selected file contents, exclude skipped files from scan coverage, and report their paths as notices. Text `.lynx.js` files remain eligible for source checks.
