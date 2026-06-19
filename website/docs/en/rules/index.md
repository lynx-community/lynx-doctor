---
title: Rules Overview
description: Overview of built-in Lynx Doctor rules for ReactLynx threading, lifecycle, events, performance, and configuration.
---

# Rules Overview

Lynx Doctor rules are an executable distillation of Lynx documentation and community skills. The current built-in rules cover:

- `reactlynx/background-only-api`
- `reactlynx/avoid-use-layout-effect`
- `reactlynx/main-thread-handler-directive`
- `reactlynx/global-props-event-mode`
- `reactlynx/lazy-without-suspense`
- `reactlynx/typescript-jsx-import-source`
- `reactlynx/types-package-missing`

List local rules:

```bash
npx lynx-doctor@latest rules list
```

Explain one rule:

```bash
npx lynx-doctor@latest rules explain reactlynx/background-only-api
```
