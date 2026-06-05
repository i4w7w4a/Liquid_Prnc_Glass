# Shader Contract

The shader implementation lives in:

```text
src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts
```

That file owns the Three.js renderer, source texture, shader material, uniforms, resizing, frame rendering, and disposal.

## Invariants

The renderer must preserve these rules:

- `ior = 0` returns a clean source.
- Negative `ior` reverses refraction direction.
- The clean source color is computed before the optical color.
- Refraction, dispersion, darkening, and highlights fade through the same master mask.
- Region selection affects the optical result, not only final color.
- Moving media textures without hardware sRGB unpack are decoded with `sRGBTransferEOTF` before optical math.
- Color correction is applied after optical composition and before `linearToOutputTexel`.
- Resize updates `uResolution` and source aspect uniforms.
- The shader never renders UI text.

## Optical Pipeline

```text
source texture
  -> working color-space decode
  -> clean source sample
  -> optical field / SDF region
  -> optional flow normal perturbation
  -> refracted UV offset
  -> RGB dispersion samples
  -> edge darkening
  -> rim/lip/sweep highlights
  -> shared mask/fade composition
  -> color correction
  -> linearToOutputTexel
```

## Signed IOR

`ior` is a signed lab control. It is not a literal physical material IOR.

```glsl
float signedOpticalPower(float ior) {
  return ior * 0.18032787;
}
```

Meaning:

- `0.0` keeps the source clean.
- positive values pull along the optical normal.
- negative values reverse the pull.

## Flow Field

Flow is a motion layer for the optical surface normal. It is not a final color warp and it is not a
separate UV offset after IOR.

The order must stay:

```glsl
vec2 flowGrad = flowGradient(p, uTime);
vec2 opticalNormal = normalize(baseNormal + flowGrad * uFlowStrength * opticalMask);
float pull = signedOpticalPower(uIOR) * opticalMask;
vec2 refractOffset = opticalNormal * pull / aspectCorrection;
```

This preserves the core invariant:

- `ior = 0` still returns the clean source, even when flow is enabled.
- negative IOR reverses the whole refractive result.
- dispersion samples around one shared `refractOffset`.

The first flow implementation is analytic:

```text
flowGradient(p, time, settings)
```

It must remain deterministic so preview, PNG frame render, and MP4 render use the same timeline.
Stateful simulation and ping-pong buffers are reserved for a later premium mode.

Flow masks:

```text
field mode -> flowMask = masterFade
edge mode  -> flowMask = borderMask
regions    -> optical masks already include regionMask
```

`flowBoundaryDamping` softens flow near mask boundaries so the effect does not create seams.

## Edge Mode

Edge mode uses a selectable signed distance field. The default remains a rounded rectangle:

```glsl
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

The active shape is routed through:

```glsl
float shapeDistance(vec2 p, vec2 innerSize, float radius);
```

The SDF boundary creates the refractive band and provides a normal by finite difference sampling. Shape icons in the UI are only previews; `shapeType` must change the shader-side signed field.

Regular shapes:

- rounded rectangle;
- circle;
- ellipse;
- diamond;
- triangle;
- hexagon.

Irregular shapes:

- soft blob;
- wave capsule;
- chipped frame;
- petal lens;
- torn oval.

Irregular shapes use stable deterministic edge variation through `shapeWarp`. Flow may perturb the
optical normal around those shapes, but the SDF silhouette itself stays stable unless a future
surface-drift mode explicitly changes that rule.

## Center-To-Edge Field

Field mode protects the center and grows the optical effect toward the image bounds:

```text
center vector -> normalized travel -> smooth fade -> master fade
```

The important rule is final composition:

```glsl
finalColor = mix(baseColor, opticalColor, masterFade);
```

Do not leave chroma, highlights, or darkening outside that fade.

## Color Space And Color Correction

The renderer writes through Three.js output color-space conversion:

```glsl
gl_FragColor = linearToOutputTexel(vec4(applyColorGrade(finalColor), 1.0));
```

For moving media sources, Three.js does not always provide hardware sRGB unpack on custom shaders.
The shader therefore keeps an explicit source decode switch:

```glsl
vec4 texel = texture2D(uSourceTexture, clamp(coverUv(vUv), vec2(0.001), vec2(0.999)));
vec3 sourceColor = uDecodeSourceTexture > 0.5 ? sRGBTransferEOTF(texel).rgb : texel.rgb;
```

`applyColorGrade` must remain neutral at:

```text
exposure 0
brightness 0
contrast 1
saturation 1
temperature 0
tint 0
gamma 1
```

`brightness` is a fine matching control, not a full crush/blowout lever.

## Effect Regions

The shader can select top, right, bottom, and left strips. The region mask must multiply the real optical masks:

```text
field mode -> masterFade *= regionMask
edge mode  -> borderMask *= regionMask
```

Applying regions only at the end can leave ghost chroma and highlight leftovers. That is not acceptable.

## Adding A Shader Parameter

Follow the chain:

```text
type/key -> default settings -> control -> uniform -> shader usage -> tests
```

If a new slider has no shader uniform or renderer behavior, it is decoration.
