# Shader

The full research index is in [Research Packs](research-packs.md). This page stays focused on the current shader implementation.

The fragment shader lives in:

```txt
src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts
```

It is currently embedded as a string because this keeps the repo simple. If the shader grows, move it to a dedicated `.glsl` file and add a Vite raw import setup.

## Core Idea

The shader draws the center of the video normally and applies glass only near the edge.

```txt
center area -> clean video
edge area   -> SDF normal -> UV refraction -> RGB dispersion -> darkening/highlight
```

## SDF

The signed distance field uses a rounded box:

```glsl
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

Meaning:

- `d < 0`: inside the clean video area;
- `d == 0`: edge boundary;
- `d > 0`: refractive glass area.

## Normal

The shader approximates the normal by sampling SDF differences:

```glsl
float dX = sdRoundedBox(p + eps.xy, innerSize, radius) - sdRoundedBox(p - eps.xy, innerSize, radius);
float dY = sdRoundedBox(p + eps.yx, innerSize, radius) - sdRoundedBox(p - eps.yx, innerSize, radius);
vec2 normal = normalize(vec2(dX, dY));
```

This normal is the direction of optical displacement.

## Refraction

The UV offset is derived from:

```glsl
float pull = (uIOR - 1.0) * borderMask * (0.07 + thickness * 0.62);
vec2 refractOffset = normal * pull / aspectCorrection;
```

Higher `uIOR` means stronger bending.

## Center-To-Edge Field

The shader now has two optical paths:

```txt
edge mode  -> clean center + SDF border refraction
field mode -> invisible center + smooth center-to-edge refraction
```

Field mode uses normalized rectangular travel from the center toward the image bounds:

```glsl
float edgeTravel = max(
  abs(centerVector.x) / max(0.5 * aspect, 0.001),
  abs(centerVector.y) / 0.5
);
```

Then it turns that travel into a mask:

```glsl
float fieldMask = smoothstep(uFieldStart, 1.0, edgeTravel);
fieldMask = pow(fieldMask, uFieldCurve);
```

Meaning:

- `uFieldStart` protects the clean center;
- `smoothstep()` avoids a hard visible seam;
- `uFieldCurve` controls how gently the effect wakes up;
- `uFieldStrength` controls the final refraction pull.

Field mode still samples the same video texture. It changes the refraction field, not the media pipeline.

## Dispersion

RGB channels sample at different offsets:

```glsl
color.r = sampleVideo(vUv + refractOffset * (1.0 + chroma * 3.5)).r;
color.g = sampleVideo(vUv + refractOffset).g;
color.b = sampleVideo(vUv + refractOffset * (1.0 - chroma * 3.5)).b;
```

Use this carefully. Too much dispersion makes the image look broken instead of expensive.

## Highlights

The shader uses three highlight components:

- rim light from edge normal and light direction;
- lower lip highlight near bottom edge;
- slow diagonal sweep.

These are controlled by `highlightStrength`.

## Rule

The shader must not render UI text. Put labels and controls in normal DOM outside the canvas.
