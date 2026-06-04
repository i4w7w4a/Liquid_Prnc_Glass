# Shader

The full research index is in [Research Packs](research-packs.md). This page stays focused on the current shader implementation.

The fragment shader lives in:

```txt
src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts
```

It is currently embedded as a string because this keeps the repo simple. If the shader grows, move it to a dedicated `.glsl` file and add a Vite raw import setup.

## Core Idea

The shader draws the center of the source normally and applies glass only near the active effect region.

```txt
source center -> clean source
active region -> SDF/field normal -> UV refraction -> RGB dispersion -> darkening/highlight
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
float pull = signedOpticalPower(uIOR) * borderMask * (0.07 + thickness * 0.62);
vec2 refractOffset = normal * pull / aspectCorrection;
```

`uIOR` is now a signed lab control:

- `0.0`: clean source video;
- positive values: bend along the surface normal;
- negative values: bend against the surface normal.

The shader maps it through `signedOpticalPower()` so the older default look stays close to the previous visual strength.

## Center-To-Edge Field

The shader now has two optical paths:

```txt
edge mode  -> clean center + SDF border refraction
field mode -> invisible center + smooth center-to-edge refraction
```

Field mode uses normalized rectangular travel from the center toward the image bounds:

```glsl
vec2 normalizedCenter = vec2(
  abs(centerVector.x) / max(0.5 * aspect, 0.001),
  abs(centerVector.y) / 0.5
);
float ellipseTravel = length(normalizedCenter);
float rectTravel = max(normalizedCenter.x, normalizedCenter.y);
float edgeTravel = mix(ellipseTravel, rectTravel, edgeBlend * 0.16);
```

Then it turns that travel into a mask:

```glsl
float fadeProgress = clamp((edgeTravel - fieldStart) / fieldSoftness, 0.0, 1.0);
float longRamp = smoothstep(uFieldStart - uFieldSoftness * 0.45, 1.18, edgeTravel);
float maskFade = pow(smoothstep(0.0, 1.0, fadeProgress) * longRamp, uFieldCurve);
float dissolveFade = pow(smootherstep01(fadeProgress), uFieldCurve * 0.82) * longRamp;
float masterFade = mix(maskFade, dissolveFade, step(0.5, uFieldFadeMode));
```

Meaning:

- `uFieldStart` protects the clean center;
- `uFieldSoftness` feathers the effect into the source video;
- `uFieldFadeMode == 0` uses the optical mask;
- `uFieldFadeMode == 1` dissolves more of the final result back into the source;
- `masterFade` is applied after the optical color is built, so refraction, dispersion, darkening, and highlights all fade together;
- `uFieldCurve` controls how gently the effect wakes up;
- `uFieldStrength` controls the final refraction pull.

Field mode still samples the same source texture. It changes the refraction field, not the media pipeline.

## Effect Regions

The shader can limit the optical effect to selected edge strips:

```txt
top / right / bottom / left
```

The region mask is computed from the distance to each selected edge:

```glsl
float regionMask = effectRegionMask(vUv);
```

Then it is applied to the real optical masks:

```glsl
masterFade *= regionMask; // field mode
borderMask *= regionMask; // SDF edge mode
```

This is deliberate. Region selection must affect refraction, dispersion, darkening, and highlights together. Applying it only at the end can leave visible optical leftovers.

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
