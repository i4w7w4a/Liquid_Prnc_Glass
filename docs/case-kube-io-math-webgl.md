# Case Pack 02: Kube.io Math On WebGL GPU

Source work:

```txt
https://gemini.google.com/share/adab45a6c003
```

Source title:

```txt
Universal physical refraction specification: Kube.io Math on WebGL GPU
```

This case pack stores the second research path for the lab. The first research pack describes the current video edge glass shader. This one describes a more general material model: a reusable profile library for GPU refraction.

The important shift:

```txt
SDF edge normal only
  -> SDF edge direction + 1D glass height profile + profile derivative
```

That gives the shader a real surface slope, not just a 2D bend direction.

## What This Case Adds

The research translates SVG displacement-map thinking into a WebGL fragment-shader model.

Old approach:

```txt
SVG feDisplacementMap
  -> baked 8-bit displacement texture
  -> browser filter pipeline
```

Target approach:

```txt
GLSL math
  -> 32-bit float computation on GPU
  -> dynamic uniforms
  -> any texture source
```

Texture source can be:

- video;
- image;
- canvas UI layer;
- procedural pattern;
- captured scene texture.

Treat the source statement "no performance limitations" as an ambition, not a law. GPU, browser, texture size, and pixel ratio still matter.

## Core Abstraction

The shader builds a one-dimensional height function:

```txt
y = f(x)
```

Where:

```txt
x = normalized travel across the glass bevel
x = 0.0 at the outer edge
x = 1.0 at the beginning of the flat center zone
y = simulated glass height
```

The current lab already has an SDF distance `d`.

Current convention:

```txt
d = 0 at the clean center boundary
d > 0 outward across the glass band
```

The Kube.io profile convention goes the other way: from outer edge toward the center. Convert once, then keep the profile functions clean:

```glsl
float edgeT = clamp(d / max(bevelWidth, 0.0001), 0.0, 1.0);
float x = 1.0 - edgeT;
```

Then a profile function converts that position into a lens height:

```glsl
float height = profile(x, profileType);
```

The derivative of that height gives the surface slope:

```glsl
float slope = profileDerivative(x, profileType);
```

The slope is what makes this case stronger than a flat SDF-normal offset.

## Profile Library

All profiles assume:

```txt
x in [0, 1]
```

Use `clamp()` before evaluating them.

### Profile A: Convex Squircle Bezel

Apple-style soft bevel. It rises sharply enough to catch light while keeping the edge smooth.

Formula:

```glsl
float fSquircle(float x) {
  x = clamp(x, 0.0, 1.0);
  return sqrt(max(0.0, 1.0 - pow(1.0 - x, 4.0)));
}
```

Use for:

- premium UI glass;
- soft rounded controls;
- video edge glass that should feel polished, not like a circular magnifier.

### Profile B: Convex Spherical Dome

Classic circular lens profile.

Formula:

```glsl
float fSpherical(float x) {
  x = clamp(x, 0.0, 1.0);
  return sqrt(max(0.0, 1.0 - pow(1.0 - x, 2.0)));
}
```

Use for:

- strong lensing;
- magnifier-like glass;
- visible bulging.

Risk:

It can look too literal if used on cinematic video edges.

### Profile C: Concave Bowl

Inverse profile for an inward glass depression.

Formula:

```glsl
float fConcave(float x) {
  x = clamp(x, 0.0, 1.0);
  return 1.0 - sqrt(max(0.0, 1.0 - pow(1.0 - x, 4.0)));
}
```

Use for:

- pressed UI surfaces;
- inset glass;
- negative refraction regions.

### Profile D: Lip / Switch Bezel

Mixed profile with sign-changing curvature.

It starts from the squircle bevel and blends toward the concave bowl by a fifth-degree Hermite curve.

Smootherstep:

```glsl
float smootherstep(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}
```

Profile:

```glsl
float fLip(float x) {
  return mix(fSquircle(x), fConcave(x), smootherstep(x));
}
```

Use for:

- switch-like beveled controls;
- glass edges with a strong lip;
- future menu elements where the edge should pull and then settle.

## Profile Derivative

The research derives the surface slope through numerical central differences.

Formula:

```txt
df/dx ~= (f(x + delta) - f(x - delta)) / (2 * delta)
```

Recommended delta:

```txt
0.001
```

GLSL:

```glsl
float profileDerivative(float x, float profileType) {
  float delta = 0.001;
  float a = profile(x + delta, profileType);
  float b = profile(x - delta, profileType);
  return (a - b) / (2.0 * delta);
}
```

Central differences are slower than hand-written analytic derivatives, but they keep the profile library easy to extend. This is correct for a lab. If a profile becomes final, consider replacing its derivative with an analytic version.

## SDF Gradient

The bevel still needs direction on the 2D plane.

The research keeps the SDF gradient:

```txt
gradD(p) ~= (
  (d(p + epsX) - d(p - epsX)) / (2 * eps),
  (d(p + epsY) - d(p - epsY)) / (2 * eps)
)
```

Then:

```glsl
vec2 gHat = normalize(gradD);
```

`gHat` is the direction of the bevel travel across the surface.

## 3D Surface Normal

The case pack combines:

```txt
2D SDF direction
profile slope
vertical surface axis
```

Formula:

```glsl
vec3 normal3 = normalize(vec3(
  -gHat.x * slope,
  -gHat.y * slope,
  1.0
));
```

This is the key upgrade.

Current lab:

```txt
normal2D -> UV offset
```

Kube.io Math case:

```txt
normal2D + profile derivative -> normal3D -> UV offset + specular light
```

## Refraction

The research uses an IOR-inspired offset:

```glsl
vec2 uvRefracted = uv + normal3.xy * (ior - 1.0) * edgeFalloff;
```

Where:

```txt
ior = n2 / n1 in the source notation
edgeFalloff = psi(d)
```

`psi(d)` is not one fixed formula. In this lab it should be the same responsibility as `borderMask`: define where the glass exists and how it fades.

Recommended implementation:

```glsl
float edgeFalloff = borderMask * bevelMask;
```

Do not let this become full-frame distortion unless the experiment explicitly asks for a lens over the whole video.

## Chromatic Dispersion

The research keeps the same wavelength idea as Case Pack 01.

Formula:

```glsl
vec2 uvR = uv + offset * (1.0 + dispersion);
vec2 uvG = uv + offset;
vec2 uvB = uv + offset * (1.0 - dispersion);
```

Sampling:

```glsl
vec3 color;
color.r = texture2D(sourceTexture, uvR).r;
color.g = texture2D(sourceTexture, uvG).g;
color.b = texture2D(sourceTexture, uvB).b;
```

Rule:

```txt
The profile creates the material. Dispersion only reveals it.
```

## Specular Rim Light

The research defines a virtual light direction:

```glsl
vec3 lightDirection = normalize(vec3(cos(specularAngle), sin(specularAngle), 0.5));
```

Use a view direction:

```glsl
vec3 viewDirection = vec3(0.0, 0.0, 1.0);
```

Half-vector:

```glsl
vec3 halfVector = normalize(lightDirection + viewDirection);
```

Phong-style intensity:

```glsl
float specular = pow(max(dot(normal3, halfVector), 0.0), 32.0) * specularOpacity;
```

Source uniform names:

```txt
uSpecularOpacity
Specular Angle
```

Potential lab uniforms:

```txt
uSpecularAngle
uSpecularOpacity
uSpecularPower
```

Keep specular separate from chromatic dispersion. They are different physical cues.

## WebGL vs SVG Filter Notes

The source research compares SVG displacement maps and WebGL fragment shaders.

Distilled comparison:

| Criterion | SVG / CSS displacement | WebGL fragment shader |
| --- | --- | --- |
| Compute path | browser filter pipeline, often CPU-bound | parallel GPU fragment work |
| Precision | baked 8-bit texture channels | 32-bit float shader math |
| Parameter updates | DOM/filter mutation | uniform update |
| Scaling | can show stepped seams | smooth if math-based |
| Dynamic flow | hard to do in real time | procedural noise can be added |
| Texture sources | DOM/filter bound | video, image, canvas, procedural texture |

Do not overstate this. WebGL is stronger for this lab, but SVG filters can still be fine for static cheap effects. The point is not ideology. The point is control.

## Integration Layers

The research names three layers.

### Renderer Layer

Responsibilities:

- create WebGL context;
- use `OrthographicCamera`;
- render one screen-space plane mesh;
- own resize and render loop.

Current file:

```txt
src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts
```

### Material Layer

Responsibilities:

- own `ShaderMaterial`;
- compile GLSL;
- expose uniforms;
- hold profile logic.

Potential future split:

```txt
src/liquid-glass/shaders/profileLibrary.glsl
src/liquid-glass/shaders/videoGlass.frag
```

### Data Layer

Responsibilities:

- provide dynamic texture input;
- video/image/canvas/procedural source;
- decide update strategy.

Current lab data source:

```txt
HTMLVideoElement -> THREE.VideoTexture
```

Future data sources:

```txt
HTMLCanvasElement -> THREE.CanvasTexture
ImageBitmap -> THREE.Texture
RenderTarget -> scene/background capture
```

## Relation To Current Lab

Current lab already implements:

- WebGL renderer;
- `THREE.VideoTexture`;
- SDF rounded rectangle;
- edge-only mask;
- central-difference SDF normal;
- IOR-like refraction;
- chromatic dispersion;
- rim/lip/sweep highlights.

This case pack adds missing research pieces:

- selectable height profiles;
- profile derivative;
- 3D surface normal;
- specular angle;
- specular opacity;
- generic texture-source architecture;
- future procedural flow.

The current shader bends UVs from a 2D SDF normal. The Kube.io Math path bends UVs from a surface normal built from SDF direction plus height slope.

## Proposed Future Controls

Add only when implementing the case, not before.

```ts
type ProfileType = 'squircle' | 'spherical' | 'concave' | 'lip'
```

Potential settings:

```txt
profileType
bevelWidth
profileStrength
ior
dispersion
specularAngle
specularOpacity
specularPower
flowStrength
```

Keep current controls stable. Add this as an advanced mode or separate route when it becomes code.

## Implementation Plan

Clean path:

1. Extract GLSL helpers into shader strings or `.glsl` raw imports.
2. Add `profile()` and `profileDerivative()`.
3. Convert current 2D normal path to optional 3D profile normal path.
4. Add `profileType` uniform.
5. Add specular uniforms.
6. Keep current shader as baseline preset.
7. Add visual A/B mode: `edge-sdf` vs `profile-surface`.
8. Verify center clean region remains untouched unless explicitly disabled.

Do not replace the working shader in one jump. A lab grows by comparison, not by erasing its previous instrument.

## GLSL Starter Block

This block is a normalized implementation seed for the case pack.

```glsl
float safeSqrt(float value) {
  return sqrt(max(0.0, value));
}

float smootherstep01(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float fSquircle(float x) {
  x = clamp(x, 0.0, 1.0);
  return safeSqrt(1.0 - pow(1.0 - x, 4.0));
}

float fSpherical(float x) {
  x = clamp(x, 0.0, 1.0);
  return safeSqrt(1.0 - pow(1.0 - x, 2.0));
}

float fConcave(float x) {
  x = clamp(x, 0.0, 1.0);
  return 1.0 - safeSqrt(1.0 - pow(1.0 - x, 4.0));
}

float fLip(float x) {
  return mix(fSquircle(x), fConcave(x), smootherstep01(x));
}

float profileHeight(float x, float profileType) {
  if (profileType < 0.5) return fSquircle(x);
  if (profileType < 1.5) return fSpherical(x);
  if (profileType < 2.5) return fConcave(x);
  return fLip(x);
}

float profileSlope(float x, float profileType) {
  float delta = 0.001;
  float a = profileHeight(x + delta, profileType);
  float b = profileHeight(x - delta, profileType);
  return (a - b) / (2.0 * delta);
}
```

## QA For This Case

Before accepting a profile-library implementation:

1. Each profile can be selected live.
2. `squircle` reads as soft premium bevel.
3. `spherical` reads as stronger dome.
4. `concave` reverses the visual pressure.
5. `lip` produces a mixed edge without a visible kink.
6. Specular highlight follows `specularAngle`.
7. `specularOpacity = 0` fully removes specular light.
8. Dispersion still follows the final refracted offset.
9. Center clean region remains stable.
10. Resize does not stretch the profile.
11. Test and build pass.

## Future Agent Rule

Before implementing this case, answer:

```txt
1. Is this changing the shape profile, the SDF direction, or the final optical sampling?
2. Is the derivative numerical or analytic?
3. Which baseline preset proves the old edge shader still works?
```

If those answers are vague, stop. The lab is for controlled experiments, not accidental rewrites.
