# Lynx Doctor documentation design

Reference: [Octop overview](https://octop.cloud/#overview). Adapt its warm peach background, centered typography, restrained navigation, and large product demonstration to Lynx Doctor.

- Preserve documentation routes, search, language and appearance controls, the product name, and the CLI's actual capabilities.
- Audience: developers diagnosing Lynx projects and handing fixes to coding agents.
- English copy: write directly for developers. Name the checks, outputs, and next action; use familiar language and avoid abstract slogans or literal translations.
- Chinese copy: write for Chinese-speaking developers rather than translating English headlines. Describe the tool and the next action in ordinary Chinese: “Lynx 项目的代码检查工具”, “快速定位代码问题”, “在你的项目里跑一次检查”. A display line break should not force a sentence into two slogans. Avoid vague praise such as “一看就知道” or “状态不错”, strained parallel phrases such as “问题和改法，一起交给 Agent”, and literal constructions such as “试试你的项目”. Use 代码检查、修改建议、修复提示词; keep technical names such as Lynx, Agent, and CI. Status messages should state the result, and command descriptions should say what will run or change.
- Density: one idea per screen, with a short heading, one explanation, and a product example or command. Keep detailed instructions in the documentation.
- Repository READMEs: use a centered brand introduction and three illustrated links for scanning, agent repair, and CI. Keep titles, descriptions, and copyable commands as live text in each language. Put the longer CLI, configuration, and Node API references in a disclosure. Artwork and generation prompts live in [assets/readme](../assets/readme/README.md).
- Logo: `docs/public/lynx-mascot-simple.png`, an apricot lynx with a broad round face, minimal features, and a small cream doctor cap with a sage-green cross. Generated with the built-in image generation tool; preserve its transparent background. Used in the navigation, favicon, homepage hero, agent prompt, and repository READMEs.
- Homepage: four viewport-sized chapters (overview, diagnostics, agent prompt, getting started) with native scroll snapping, chapter links, and brief entrance transitions. Narrow/short viewports and reduced-motion settings use gentler scrolling. Preserve `#get-started` and scope the scroller to the homepage.
- The diagnostics are a simplified presentation of actual bundled-example output. The agent prompt is labeled as illustrative content based on the rule's real fix advice.
- Palette: white `#ffffff`, charcoal `#25211f`, muted ink `#756d67`, peach `#fff2e9`, coral `#b95137`; green `#28775b` denotes a healthy scan. Dark mode uses warm charcoal surfaces.
- Typography: PingFang SC / Helvetica Neue / Segoe UI for copy; SFMono-Regular / Consolas for commands and diagnostics. No external font requests.
- Spacing: 8 px base, 16–32 px component spacing, 40–100 px screen padding and layout gaps. Main chapter content width up to 1120 px.
- Shape: 8–9 px controls, 12–14 px panels, capsule only for the source link. Shadows restricted to the product demonstration and selected controls.
- Motion: 160 ms state feedback, 560 ms chapter entrances, native smooth page navigation. Under reduced motion, remove reveals and animated scrolling.
- Example provenance: `node packages/lynx-doctor/bin/lynx-doctor.js examples/threading-regressions --no-agent-select` yields 64/100, three errors at `src/App.tsx:16:21`, `18:13`, and `28:30`; `examples/healthy-shop` yields 100/100 with no findings. Rescan these examples when changing the displayed snapshot.
