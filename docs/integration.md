# Integration

Liquid Prnc Glass can hand off the active optical state to another project.

The lab has two useful integration surfaces:

- component boundary for React/WebGL reuse;
- generated Markdown brief for another engineer or agent.

## Component Boundary

Import from the local module:

```tsx
import { WebGLVideoEdgeGlass } from './liquid-glass'
import type { LiquidGlassSettings } from './liquid-glass'
```

The React bridge owns hidden source elements and a visible canvas. The renderer owns Three.js and the shader lifecycle.

## Integration Brief

The brief generator lives in:

```text
src/liquid-glass/integrationBrief.ts
```

It includes:

- repository URL;
- active preset JSON;
- readable value summaries for core optics, center field, shape, flow, regions, and color;
- signed IOR rule;
- center-to-edge field formula;
- source color-space decode rule;
- refraction sampling;
- final composition rule;
- acceptance checks.

Use `Brief` in the UI when another project needs a precise handoff. A preset alone is too thin; the receiving project needs the shader contract as well.

## Porting Rules

When moving the effect elsewhere:

1. Preserve the clean-source path.
2. Preserve signed IOR behavior.
3. Preserve shared master fade.
4. Preserve region masking inside the optical pipeline.
5. Preserve source color-space decode and `linearToOutputTexel` output.
6. Preserve cover-fit source sizing.
7. Preserve resize updates for resolution and aspect uniforms.
8. Verify browser console and GPU resource disposal.

## Non-Goals

- Do not port this as CSS blur.
- Do not rebuild it as an SVG overlay.
- Do not couple it to one site layout.
- Do not hardcode one media source into the renderer.
