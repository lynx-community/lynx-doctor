---
title: CSS 兼容性
description: 按渲染后端与最低 Lynx 引擎版本检查 CSS 兼容性。
---

# CSS 兼容性

`lynx-css` 分类基于 [`lynx-check-css-support` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-check-css-support/SKILL.md)，固定使用 `@lynx-js/css-defines@0.0.16` 数据。扫描时不下载新数据，也不执行 skill 命令。

在 `lynx-doctor.config.json` 配置最低支持的 **Lynx 引擎版本**，该版本与 ReactLynx npm 包版本独立：

```json
{
  "targets": { "android": "3.5", "ios": "3.6" }
}
```

支持的后端为 `android`、`ios`、`harmony`、`clay_android`、`clay_ios`、`clay_macos`、`clay_windows` 和 `web_lynx`。版本必须是 `"3.6"`、`"3.6.1"` 等数字字符串。

```css
.card {
  filter: brightness(0.5);
}
```

上述配置下，规则会提示 `filter.brightness` 需要 Android Lynx 3.6；iOS 3.6 检查通过。

| 规则 | 默认级别 | 判断依据 |
| --- | --- | --- |
| `lynx-css/unsupported` | error | 数据明确标记为 `false` |
| `lynx-css/requires-newer-version` | error | 目标版本低于数字形式的最低版本 |
| `lynx-css/conditional-support` | warning | 部分支持，或存在 `targetSdkVersion` 等额外条件 |

未知属性、缺失的后端数据和 `null` 均视为**未知**，不会报成不支持，也不构成支持证明。JSON 报告中的 `cssCoverage` 包含目标、数据版本、文件/声明数量以及未知比较数量；终端报告显示未配置或未知覆盖提示。未配置 targets 时跳过兼容性检查。

首版检查 `.css` 声明、属性本身，以及可直接匹配已发布特性名称的字面量关键字或函数。不会完整评估自定义属性、变量、内联/动态样式、分组特性、选择器、级联回退和预处理器文件。条件规则内的声明也逐条检查。面向其他运行时的样式可通过文件忽略排除；外部已有兼容措施时可调整规则级别。数据声明的支持范围不等同于完整运行时行为。

全量、diff 和 staged 扫描遵循同一忽略配置。staged CSS 读取 Git 暂存区，项目配置仍读取工作区。
