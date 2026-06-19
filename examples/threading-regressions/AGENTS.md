# Threading Regressions Agent Notes

Read Lynx docs before editing: https://lynxjs.org/llms.txt.

This project intentionally contains Lynx Doctor findings. Fixes should move native module calls into background-only contexts, replace `useLayoutEffect`, and add explicit main-thread handler directives.
