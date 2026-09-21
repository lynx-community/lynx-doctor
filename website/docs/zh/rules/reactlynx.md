---
title: reactlynx 规则
description: 源自 reactlynx-best-practices skill 的 reactlynx 规则。
---

# reactlynx 规则

`reactlynx` 一级分类源自 [`reactlynx-best-practices`](https://github.com/lynx-community/skills/tree/release/skills/reactlynx-best-practices) skill，用来显式检查线程、生命周期、事件、性能和项目配置假设。

当前二级分类：

- `threading`：`reactlynx/background-only-api`
- `lifecycle`：`reactlynx/avoid-use-layout-effect`
- `events`：`reactlynx/main-thread-handler-directive`
- `configuration`：`reactlynx/global-props-event-mode`、`reactlynx/typescript-jsx-import-source`、`reactlynx/types-package-missing`
- `performance`：`reactlynx/lazy-without-suspense`

典型线程问题：

```tsx
export function App() {
  const analytics = lynx.getJSModule("Analytics");
  analytics.track("render");
  return <view />;
}
```

推荐把 background-only 工作移到后台上下文：

```tsx
export function App() {
  useEffect(() => {
    "background only";
    lynx.getJSModule("Analytics").track("mounted");
  }, []);

  return <view />;
}
```

过滤这个分类：

```bash
npx lynx-doctor@latest --category reactlynx --json
```

## 分析边界

线程规则使用 JavaScript/TypeScript 语法树和局部绑定，识别 ReactLynx Hook 别名、原生事件/ref 回调、函数首条语句中的指令、background-only 模块，以及所有调用点都能确认为后台上下文的局部辅助函数。注释、字符串、类型位置和遮蔽全局变量的局部变量不会触发 API 误报。

从其他文件导入的主线程 handler 不会因看不到函数体而被判定缺少指令；当前不解析跨文件函数体和动态回调工厂。无法确认线程的自定义组件回调应显式标记指令。显式导入 React DOM 的文件会跳过 ReactLynx 检查。源码语法错误会中止扫描并报告文件位置。

TypeScript 检查读取合并后的 JSONC 配置，支持相对路径、包路径和多个 `extends`。组件库可保留 JSX；自动 JSX runtime 需要 `jsxImportSource: "@lynx-js/react"`。`verbatimModuleSyntax` 也满足隔离模块语义。继承配置缺失或无效时会给出明确错误。

TypeScript 规则还引用了 [`lynx-typescript` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-typescript/SKILL.md)。所有规则来源固定到已审查的 skills 提交，确保报告和 Agent 修复依据可复现。

## 原生元素与事件

`reactlynx/no-dom-elements` 提示 Lynx 源码中的 `div`、`span`、`img` 等常见 Web 标签，建议使用 `view`、`text`、`image`。不会拒绝未知自定义原生标签；宿主确实注册了 Web 同名元素时，可关闭该警告。

`reactlynx/native-element-events` 检查已知原生元素上的 Web 点击/触摸事件写法，例如 `<view onClick={onTap}>` 应使用 `bindtap`。自定义组件遵循自身接口，例如 lynx-ui `Button` 应使用 `onClick`。Button 检查识别导入别名和跨行 JSX，并排除同名局部组件。

这两项检查引用 [`lynx-api-docs` skill](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/lynx-api-docs/SKILL.md)。

## 组件库入口

同时声明 `@lynx-js/react` peer dependency 和公共包入口的组件库，如果把原始 TS/TSX 暴露为常规运行时入口，会收到 `reactlynx/library-runtime-entry` 警告。应用入口项目不触发该规则；显式 source 条件和 `jsnext:source` 允许保留源码入口。

构建组件库后执行：

```bash
lynx-doctor --package
```

`reactlynx/library-missing-artifact` 检查字面量 `main`、`module`、`types`/`typings` 和 `exports` 的 import/require/default/types 路径是否指向包内实际文件。例如构建输出 `.jsx`，但导出仍写为 `.js` 时会报告错误。日常扫描不要求提前构建。

`--package` 读取工作区产物，不能与 diff/staged 混用。通配符入口、回退数组和自定义条件不做完整解析。不会执行构建或生命周期脚本，不验证 tarball 文件包含情况，也不根据 factory 调用推断 JSX 是否被提前转换。发布前仍应检查打包产物并运行消费方构建，具体见 [组件库打包 skill 规则](https://github.com/lynx-community/skills/blob/715f74063c53ec3d50e68b28b90e163b33cbc6b6/skills/reactlynx-best-practices/rules/component-library-packaging.md)。
