---
title: lynx-ui rules
description: lynx-ui rules sourced from the lynx-ui skill references.
---

# lynx-ui rules

The `lynx-ui` category is sourced from the [`lynx-ui`](https://github.com/lynx-community/skills/tree/release/skills/lynx-ui) skill. It converts the skill's routing, foundation, and component API references into checks that catch common usage drift.

Current subcategories:

- `imports`: `lynx-ui/prefer-public-aggregate-import`
- `component-api`: `lynx-ui/button-uses-on-click`
- `gestures`: `lynx-ui/gesture-components-enable-new-gesture`

Example:

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

When gesture components are present, verify the ReactLynx plugin config:

```ts
pluginReactLynx({
  enableNewGesture: true
});
```

Filter this category:

```bash
npx lynx-doctor@latest --category lynx-ui --json
```
