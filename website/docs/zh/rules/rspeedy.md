---
title: rspeedy 规则
description: 源自 rspeedy-bundle-size skill 的 rspeedy 包体积规则。
---

# rspeedy 规则

`rspeedy` 一级分类源自 [`rspeedy-bundle-size`](https://github.com/lynx-community/skills/tree/release/skills/rspeedy-bundle-size) skill。这些规则关注 shipped bundle bytes，而不是运行时性能。

当前二级分类：

- `bundle-size`：`rspeedy/no-export-star-barrels`、`rspeedy/no-eval-in-bundle-code`

第一批检查来自该 skill 的 three-lever 包体积 reference：避免 `export *` barrel 这类结构性 tree-shaking 阻碍，并标记可能影响生产产物 name mangling 的 `eval()`。

过滤这个分类：

```bash
npx lynx-doctor@latest --category rspeedy --json
```
