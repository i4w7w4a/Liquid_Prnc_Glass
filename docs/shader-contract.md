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
- Resize updates `uResolution` and source aspect uniforms.
- The shader never renders UI text.

## Optical Pipeline

```text
source texture
  -> clean source sample
  -> optical field / SDF region
  -> refracted UV offset
  -> RGB dispersion samples
  -> edge darkening
  -> rim/lip/sweep highlights
  -> shared mask/fade composition
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

## Edge Mode

Edge mode uses a rounded-box signed distance field:

```glsl
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

The SDF boundary creates the refractive band and provides a normal by finite difference sampling.

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
