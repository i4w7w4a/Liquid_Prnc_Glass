# Source And Region Research

Date: 2026-06-05

## Goal

Add two capabilities without breaking the laboratory contract:

- choose where the optical effect is active: all edges, top/bottom, sides, or a single edge;
- choose the rendered source: default demo, uploaded image, or uploaded motion source, with viewport, natural, or manual frame sizing.

## Decisions

### Optical Preset Stays Separate

`LiquidGlassSettings` keeps optical state and effect-region state only.

Uploaded files, object URLs, local source names, and preview frame size are not stored in the optical preset. They are session state. This keeps exported shader presets clean and portable.

### Region Mask Is Shader-Side

The region selection is not a CSS overlay. The shader computes:

```glsl
regionMask = max(topStrip, rightStrip, bottomStrip, leftStrip)
```

Then it multiplies the real optical masks:

- `masterFade` in center-to-edge field mode;
- `borderMask` in SDF edge mode.

This matters because refraction, dispersion, darkening, and highlights must all disappear outside the selected strips. If only the final color were masked, ghost chroma and highlights could remain.

### Source Texture Is Generic

The renderer now accepts:

- `HTMLVideoElement` through `THREE.VideoTexture`;
- `HTMLImageElement` through `THREE.Texture`.

Shader names were moved from `VideoTexture` thinking to `SourceTexture` thinking:

- `uSourceTexture`;
- `uSourceAspect`;
- `sampleSource()`;
- `sampleDispersedSource()`.

### Source Size Has Priority Rules

Frame sizing is separate from source sampling:

1. `Viewport` keeps the old full-screen lab behavior.
2. `Natural` uses loaded source metadata.
3. `Manual` uses typed pixel dimensions.

Texture sampling still uses the natural source aspect. The preview frame aspect comes from the selected frame size. If manual dimensions differ from the source aspect, the shader cover-fit path crops instead of stretching the source.

## Risks Found

### Media Ready Race

Risk: a previous source could leave `sourceReady = true`, letting the renderer create a texture before the newly uploaded source had loaded.

Resolution: readiness is keyed by `kind:src`. The renderer only starts when the current source key has loaded.

### Object URL Lifecycle

Risk: uploaded object URLs can leak if not revoked.

Resolution: uploaded URLs are stored separately and revoked by effect cleanup when replaced or reset.

### Region Defaults

Risk: if region width defaulted to a narrow strip, old presets would visually change.

Resolution: default region state enables all edges with `regionWidth: 1`, preserving the old full-frame field behavior. When a user selects a narrow preset, the UI lowers `regionWidth` from `1` to `0.32` automatically.

### Manual Size Vs Natural Aspect

Risk: users can unlock aspect and set a frame that differs from the source aspect.

Resolution: this is allowed deliberately. The source is cover-fit into the manual frame rather than mathematically distorted.

## Verification

Automated:

- `settings.test.ts` covers region defaults, parsing, legacy presets, and invalid region controls.
- `sourceLayout.test.ts` covers natural fallback, aspect-locked manual resizing, unlocked resizing, and dimension clamping.
- `npm run test` passes.
- `npm run build` passes.

Manual browser checks still matter after this because upload controls depend on browser file APIs and WebGL texture readiness.

## Remaining Weak Points

- Uploaded source state is local-only. If exact source composition must be transferred to another project, the integration brief should grow a separate source section.
- Large uploaded images can consume memory even when the visible frame is scaled down.
- The control panel is becoming dense. The next large feature should likely introduce collapsible subsections or a narrower mode selector instead of another always-open group.
