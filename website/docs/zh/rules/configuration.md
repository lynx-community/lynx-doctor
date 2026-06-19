---
title: 配置规则
description: 检查 ReactLynx TypeScript、globalPropsMode 和 lazy/Suspense 等项目配置问题。
---

# 配置规则

配置类规则帮助项目保持可被 Lynx 工具链和 agent 正确理解。

## TypeScript

ReactLynx 项目应配置：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@lynx-js/react",
    "isolatedModules": true
  }
}
```

同时声明 `@lynx-js/types`，用于 Lynx 全局对象、事件、NativeModules 和自定义元素类型。

## globalPropsMode

当 Rspeedy 配置里使用 `globalPropsMode: "event"` 时，直接读取 `lynx.__globalProps` 的组件不会再依赖根级 `forceUpdate` 自动刷新。需要更新的值应通过 `useGlobalPropsChanged` 显式订阅。

## lazy 和 Suspense

`lazy()` 组件应有就近 `Suspense` fallback。重要分包还应配 ErrorBoundary，并检查 CSS bundle scope 假设。
