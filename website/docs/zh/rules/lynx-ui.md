---
title: lynx-ui 规则
description: 源自 lynx-ui skill references 的 lynx-ui 规则。
---

# lynx-ui 规则

`lynx-ui` 一级分类源自 [`lynx-ui`](https://github.com/lynx-community/skills/tree/release/skills/lynx-ui) skill。它把 skill 的 routing、foundation 和组件 API references 转成检查项，用来发现常见的组件使用漂移。

当前二级分类：

- `imports`：`lynx-ui/prefer-public-aggregate-import`
- `component-api`：`lynx-ui/button-uses-on-click`
- `gestures`：`lynx-ui/gesture-components-enable-new-gesture`

示例：

```tsx
import { Button, Draggable } from "@lynx-js/lynx-ui";

export function Toolbar() {
  return (
    <view>
      <Button onClick={() => console.log("save")}>Save</Button>
      <Draggable />
    </view>
  );
}
```

如果使用手势组件，需要检查 ReactLynx 插件配置：

```ts
pluginReactLynx({
  enableNewGesture: true
});
```

过滤这个分类：

```bash
npx lynx-doctor@latest --category lynx-ui --json
```
