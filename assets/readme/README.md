# README artwork

The README uses a centered brand introduction and three illustrated workflow cards, inspired by the structure of [trycua/cua](https://github.com/trycua/cua#readme). The illustrations use Lynx Doctor's own mascot and warm palette.

Generated with the built-in `image_gen` tool. The reference image for all three assets is `../../website/docs/public/lynx-mascot-simple.png`. Keep the doctor cap, green cross, apricot face, simple features, and bold cocoa outlines consistent. Titles, descriptions, and commands remain selectable text in the English and Chinese READMEs.

## scan.png

Output: `assets/readme/scan.png`.

### Generation prompt

```text
Use case: illustration-story. Asset type: one illustration for a GitHub README feature card, landscape 3:2 composition. Input image 1 is the identity reference for Lynx Doctor. Preserve its broad round apricot lynx face, cream cheeks, two simple dark oval eyes, tiny dark nose and w-shaped smile, cocoa outlines, small blush circles, dark ear tufts, and small cream doctor cap with one sage-green cross. The cap and both ears must remain visible. This is the same mascot, not a new character. Use very few lines, large simple shapes, flat gentle colors, and a clean polished friendly editorial illustration. The main figure may have two tiny rounded paws but no detailed body. Use generous empty space, evenly weighted composition and a plain softly colored background. No lettering, words, brand names, watermark, readable code, multiple characters, clutter, photographic texture, 3D materials, excessive glow, or detailed fur. This image will have a live text title and description below it in the README; put no text inside the image. Scene: the lynx is inspecting a small cream code window with a simple magnifying glass held in one paw. The window has only three short horizontal cocoa strokes and a single coral issue dot. The lynx sits behind the window at center-left; magnifier and small window sit at lower right, with clear space around all outlines. Warm pale peach background #fff2e9. Keep the lynx expression calm and curious. The head and cap are the dominant visual, clearly recognizable even at 240 pixels wide.
```

## agent.png

Output: `assets/readme/agent.png`.

### Generation prompt

```text
Use case: illustration-story. Asset type: one illustration for a GitHub README feature card, landscape 3:2 composition. Input image 1 is the identity reference for Lynx Doctor. Preserve its broad round apricot lynx face, cream cheeks, two simple dark oval eyes, tiny dark nose and w-shaped smile, cocoa outlines, small blush circles, dark ear tufts, and small cream doctor cap with one sage-green cross. The cap and both ears must remain visible. This is the same mascot, not a new character. Use very few lines, large simple shapes, flat gentle colors, and a clean polished friendly editorial illustration. The main figure may have two tiny rounded paws but no detailed body. Use generous empty space, evenly weighted composition and a plain softly colored background. No lettering, words, brand names, watermark, readable code, multiple characters, clutter, photographic texture, 3D materials, excessive glow, or detailed fur. This image will have a live text title and description below it in the README; put no text inside the image. Scene: the lynx proudly holds a cream repair clipboard with one large sage-green check mark and two short cocoa strokes. The clipboard sits at lower right next to the lynx face; one tiny paw rests on its edge. The lynx sits at center-left. Warm ivory background #faf6ed. Keep the lynx smile simple and calm. The head and cap are the dominant visual, clearly recognizable even at 240 pixels wide.
```

## ci.png

Output: `assets/readme/ci.png`.

### Generation prompt

```text
Use case: illustration-story. Asset type: one illustration for a GitHub README feature card, landscape 3:2 composition. Input image 1 is the identity reference for Lynx Doctor. Preserve its broad round apricot lynx face, cream cheeks, two simple dark oval eyes, tiny dark nose and w-shaped smile, cocoa outlines, small blush circles, dark ear tufts, and small cream doctor cap with one sage-green cross. The cap and both ears must remain visible. This is the same mascot, not a new character. Use very few lines, large simple shapes, flat gentle colors, and a clean polished friendly editorial illustration. The main figure may have two tiny rounded paws but no detailed body. Use generous empty space, evenly weighted composition and a plain softly colored background. No lettering, words, brand names, watermark, readable code, multiple characters, clutter, photographic texture, 3D materials, excessive glow, or detailed fur. This image will have a live text title and description below it in the README; put no text inside the image. Scene: the lynx rests two tiny paws on a simple horizontal workflow of three small rounded cream tiles joined by thin sage-green connectors. Each tile has one sage-green check mark. The lynx head is centered above the workflow, with the whole cap and ears in view. Pale mint-cream background #edf6ef. Keep the lynx smile simple and calm. The head and cap are the dominant visual, clearly recognizable even at 240 pixels wide.
```

## Final background edits

The agent and CI illustrations were then flattened by the built-in image editing tool onto light pastel backgrounds, preserving the mascot and composition. The saved PNGs above are the final outputs.

### agent.png

```text
Use case: precise-object-edit. The attached image is the edit target, a Lynx Doctor README illustration. Keep the exact mascot, doctor cap, green cross, face, paws, props, composition, outlines, colors, and 1536 by 1024 landscape framing unchanged. Change only the background: replace all transparency and the dark blurred halo with an even, fully opaque, flat pale background, color #faf6ed. This must be a flattened illustration on a solid pastel canvas, with opacity 100% at every pixel, including the corners. No transparent pixels, no black background, no checkerboard, no dark vignette, no glow, no shadows around the silhouette. All cocoa outlines, including the ear tufts, must be crisp and easily visible against the light pastel background. Do not add text, objects, decorations, or new features.
```

### ci.png

```text
Use case: precise-object-edit. The attached image is the edit target, a Lynx Doctor README illustration. Keep the exact mascot, doctor cap, green cross, face, paws, props, composition, outlines, colors, and 1536 by 1024 landscape framing unchanged. Change only the background: replace all transparency and the dark blurred halo with an even, fully opaque, flat pale background, color #edf6ef. This must be a flattened illustration on a solid pastel canvas, with opacity 100% at every pixel, including the corners. No transparent pixels, no black background, no checkerboard, no dark vignette, no glow, no shadows around the silhouette. All cocoa outlines, including the ear tufts, must be crisp and easily visible against the light pastel background. Do not add text, objects, decorations, or new features.
```
