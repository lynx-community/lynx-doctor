---
"lynx-doctor": minor
---

Diagnose native element contracts and component library entry points.

- Flag web-style event props on known native elements and warn about common DOM tags used in Lynx JSX, while leaving custom components alone.
- Resolve actual `lynx-ui` Button imports, including aliases and multiline JSX, to avoid applying Button checks to unrelated components.
- Warn when component libraries expose raw TypeScript as runtime entries.
- Add `--package` to check existing runtime and declaration entry files after a library build, including missing artifacts and mismatched entries.

`--package` reads working-tree artifacts and cannot be combined with `--diff` or `--staged`. It does not build the library or validate the contents of its published tarball.
