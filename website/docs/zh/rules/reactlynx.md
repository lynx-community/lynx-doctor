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
