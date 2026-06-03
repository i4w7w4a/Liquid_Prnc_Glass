# Research: Liquid Glass Over Video

This document is the technical memory of the effect.

Source work:

```txt
https://gemini.google.com/share/dd8d46024d72
```

Source title:

```txt
Specification and architectural research for a premium WebGL Liquid Glass / Refraction Lens effect
```

This is not a blind copy of the source text. It is the distilled engineering base for this repository: the physics model, formulas, shader contract, video pipeline, QA rules, and the decisions that future work must preserve.

## Scope

The target effect is not CSS glassmorphism.

The old tools are not the core technique:

- no `backdrop-filter` as the main effect;
- no static SVG displacement as the main effect;
- no pre-baked PNG glass overlay as the main effect;
- no DOM blur trick pretending to be refraction.

The core technique is GPU refraction over a live video texture.

The current lab uses Three.js and GLSL:

```txt
HTMLVideoElement
  -> THREE.VideoTexture
  -> full-screen quad
  -> fragment shader
  -> SDF edge mask
  -> SDF normal
  -> UV refraction
  -> RGB dispersion
  -> absorption and highlights
```

## Source Map

The Gemini research covered these areas:

1. Mathematical basis and optical architecture.
2. Fragment shader design.
3. Video texture performance.
4. Three.js renderer structure.
5. UI icon / skull effect strategy.
6. Developer implementation steps.
7. QA and visual acceptance metrics.

This repository keeps those areas as working constraints.

## First Principle

Liquid glass is a controlled sampling error.

The shader does not draw glass as a separate picture. It samples the video from a slightly displaced coordinate. If the displacement follows a believable edge normal, the eye reads the result as a refractive physical surface.

Bad glass bends everything equally.

Good glass bends only where thickness exists: corners, rims, lips, bevels, and local optical gradients.

## Coordinate Model

The shader receives normalized UV coordinates:

```txt
uv.x in [0, 1]
uv.y in [0, 1]
```

For SDF work, the UV is remapped around the center:

```glsl
vec2 p = (uv - 0.5) * aspectCorrection;
```

`aspectCorrection` prevents the SDF from stretching when the canvas is not square:

```glsl
float aspect = resolution.x / max(resolution.y, 1.0);
vec2 aspectCorrection = vec2(aspect, 1.0);
```

Without this correction, a mathematically round corner becomes visually oval.

## SDF Shape

The source research uses a signed distance field for a rounded rectangle.

Core formula:

```glsl
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

Definitions:

```txt
p = current point in centered, aspect-corrected space
b = half-size of the inner clean rectangle
r = corner radius
d = signed distance returned by SDF
```

Meaning:

```txt
d < 0  inside the clean video region
d = 0  boundary of the inner clean region
d > 0  outside the clean region, inside the glass band
```

The current implementation keeps the center untouched:

```glsl
if (d < -0.001) {
  gl_FragColor = vec4(sampleVideo(vUv), 1.0);
  return;
}
```

This invariant matters. The effect is edge glass over video, not a global warping filter.

## Edge Band

The glass exists in a band around the SDF boundary.

Conceptual mask:

```glsl
float enter = smoothstep(edgeStart, edgePeak, d);
float exit = 1.0 - smoothstep(edgeEnd, edgeFadeOut, d);
float edgeMask = enter * exit;
```

Current implementation:

```glsl
float borderMask = smoothstep(-0.001, thickness * 0.15, d) *
  (1.0 - smoothstep(thickness * 0.62, thickness * 1.24, d));
```

The first `smoothstep` fades the effect in near the boundary. The second fades it out before the whole image becomes warped.

## SDF Normal

Refraction needs a direction.

The source model derives that direction from the gradient of the SDF. In shader code, the gradient is approximated with central differences:

```glsl
float dX = sdf(p + vec2(eps, 0.0)) - sdf(p - vec2(eps, 0.0));
float dY = sdf(p + vec2(0.0, eps)) - sdf(p - vec2(0.0, eps));
vec2 normal = normalize(vec2(dX, dY));
```

Current implementation:

```glsl
vec2 eps = vec2(0.0015, 0.0);
float dX = sdRoundedBox(p + eps.xy, innerSize, radius) -
  sdRoundedBox(p - eps.xy, innerSize, radius);
float dY = sdRoundedBox(p + eps.yx, innerSize, radius) -
  sdRoundedBox(p - eps.yx, innerSize, radius);
vec2 grad = vec2(dX, dY);
vec2 normal = length(grad) > 0.00001 ? normalize(grad) : vec2(0.0);
```

This normal points along the strongest local distance change. It becomes the optical bend direction.

## Refraction Model

The research uses an index-of-refraction inspired model:

```txt
refractedUv = uv + normal * edgeMask * (ior - 1.0) * strength
```

`ior` is not a full physical simulation of Snell's law here. It is a practical optical control. Higher values increase bend strength.

Current implementation:

```glsl
float pull = (uIOR - 1.0) * borderMask * (0.07 + thickness * 0.62);
vec2 refractOffset = normal * pull / aspectCorrection;
```

The division by `aspectCorrection` maps the normal back into UV space.

Useful range:

```txt
1.05 - 1.35  controlled premium glass
1.35 - 1.55  aggressive stress tuning
```

## Dispersion

Real lenses separate wavelengths slightly. The shader approximates this by sampling red, green, and blue at different UV offsets.

Conceptual formula:

```glsl
vec3 color;
color.r = texture2D(video, uv + offset * redScale).r;
color.g = texture2D(video, uv + offset).g;
color.b = texture2D(video, uv + offset * blueScale).b;
```

Current implementation:

```glsl
float chroma = clamp(uDispersion, 0.0, 0.12);
color.r = sampleVideo(vUv + refractOffset * (1.0 + chroma * 3.5)).r;
color.g = sampleVideo(vUv + refractOffset).g;
color.b = sampleVideo(vUv + refractOffset * (1.0 - chroma * 3.5)).b;
```

Good dispersion is small. If it becomes the first visible feature, the glass is no longer expensive. It is just noisy.

Useful range:

```txt
0.008 - 0.028  practical range
0.04+          stress range
```

## Absorption And Edge Darkening

Thicker glass transmits less light. The lab uses edge darkening to mimic absorption.

Conceptual formula:

```glsl
float absorption = edgeMask * bevel * edgeDarkening;
color = mix(color, color * (1.0 - absorption), edgeMask);
```

Current implementation:

```glsl
float bevel = pow(1.0 - clamp(d / max(thickness, 0.001), 0.0, 1.0), 0.58);
float absorption = borderMask * bevel * clamp(uEdgeDarkening, 0.0, 1.0);
color = mix(color, color * (1.0 - absorption), borderMask);
```

This is one of the main differences between a fake border and something that reads as material.

## Highlights

The source research separates optical bending from decorative light. The current lab keeps that split.

Current highlight components:

```txt
rimLight   = directional response from SDF normal
lowerLip   = stronger lower edge accent
sweep      = slow moving diagonal glint
```

Shader excerpt:

```glsl
vec2 lightDirection = normalize(vec2(-0.46, -0.89));
float rimLight = pow(max(dot(normal, -lightDirection), 0.0), 2.8) * borderMask;
float lowerLip = smoothstep(0.56, 1.0, vUv.y) * borderMask;
float sweep = smoothstep(0.025, 0.0, abs(vUv.x - fract(uTime * 0.055 + vUv.y * 0.28)));
```

Rule:

```txt
Refraction first. Highlights last.
```

If the highlight is doing all the work, the shader is hiding a weak optical model.

## Video Texture Pipeline

The research recommends `THREE.VideoTexture` for direct video-to-GPU sampling.

Required texture settings:

```ts
videoTexture.generateMipmaps = false
videoTexture.magFilter = THREE.LinearFilter
videoTexture.minFilter = THREE.LinearFilter
videoTexture.colorSpace = THREE.SRGBColorSpace
```

Reason:

- dynamic video frames should not rebuild mipmaps every frame;
- linear filtering keeps scaled video stable;
- sRGB keeps color response closer to the source media.

The current renderer follows this.

## Frame Update Strategy

The research recommends `requestVideoFrameCallback` when available.

Reason:

```txt
requestAnimationFrame can run at 60/120 Hz
video may update at 24/30 Hz
```

Updating the GPU texture on every RAF wastes work. `requestVideoFrameCallback` updates the texture only when the browser has a new decoded video frame.

Current behavior:

```ts
if (requestVideoFrameCallback exists) {
  update videoTexture.needsUpdate from video-frame callback
} else {
  update videoTexture.needsUpdate inside render loop
}
```

This fallback keeps Safari / older browser behavior sane.

## Renderer Architecture

The source research recommends a simple renderer:

```txt
WebGLRenderer
OrthographicCamera
Scene
PlaneGeometry(2, 2)
ShaderMaterial
VideoTexture uniform
```

The current implementation follows this shape.

The quad is full-screen in clip space:

```glsl
gl_Position = vec4(position.xy, 0.0, 1.0);
```

No perspective camera is needed. This is a 2D post-process style pass over a video surface.

## Renderer Settings

Recommended base:

```ts
new THREE.WebGLRenderer({
  canvas,
  alpha: false,
  depth: false,
  stencil: false,
  powerPreference: 'high-performance',
})
```

The current implementation adds:

```ts
antialias: true
```

This is a conscious lab divergence. The source research prefers turning antialias off for raw performance. The lab keeps it on because this repository is allowed to be demanding and quality-first.

If mobile performance becomes a target, test `antialias: false` as a separate preset branch.

## Pixel Ratio

The source research suggests capping device pixel ratio around `2.0` for a strong default.

This lab exposes pixel ratio as a control:

```txt
1.0  low
2.0  high-end default
3.0  stress
```

Reason:

The user wants a lab, not only a production-safe component. The lab must let us see when extra GPU cost creates visible value.

## Resize Contract

Resize must update:

```txt
renderer size
pixel ratio
uResolution
uVideoAspect
```

Current renderer:

```ts
this.renderer.setPixelRatio(pixelRatio)
this.renderer.setSize(width, height, false)
this.material.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height)
this.material.uniforms.uVideoAspect.value = videoAspect
```

Failure signs:

- SDF corners stretch;
- center video drifts;
- edge thickness changes after resize;
- glass seam appears along the canvas border.

## UI Icon / Skull Research

The Gemini research also discussed a skull/menu icon effect.

The clean path for small UI icons is:

```txt
2D sprite + normal map + shader refraction
```

Preferred over:

```txt
GLB / PBR 3D model inside a tiny UI control
```

Reason:

- sprite control is pixel-perfect;
- normal maps can encode bevels and surface direction;
- GPU cost is low;
- the effect remains easy to align with DOM UI.

Normal-map sampling model:

```glsl
vec2 normalOffset = (normalTex.xy * 2.0 - 1.0) * refractionScale;
vec2 backgroundUv = gl_FragCoord.xy / resolution;
vec3 refractedScene = texture2D(videoTexture, backgroundUv + normalOffset).rgb;
```

This lab does not yet implement the icon path. Keep this note because it is the correct future direction for glass UI symbols.

## Current Implementation Mapping

| Research item | Lab implementation |
| --- | --- |
| Live video as GPU texture | `THREE.VideoTexture` |
| No CSS glass as core | WebGL fragment shader |
| SDF rounded rectangle | `sdRoundedBox()` |
| Clean center | Early return when `d < -0.001` |
| Edge-only refraction | `borderMask` |
| SDF normal | central differences |
| IOR strength | `uIOR` |
| RGB dispersion | `uDispersion` |
| Absorption | `uEdgeDarkening` |
| Rim/light accents | `uHighlightStrength` |
| Video frame callback | `requestVideoFrameCallback` path |
| Quality stress control | exposed `pixelRatio` |

## Deliberate Divergences

The lab is not a frozen transcription of the source. It makes these deliberate choices:

1. `antialias: true` is enabled for quality-first preview.
2. `pixelRatio` can reach `3`, because this is a tuning lab.
3. Highlights include a slow sweep, because the user needs visible tuning feedback.
4. The shader stays embedded in TypeScript for now, to keep the first repo small.
5. The center is stricter than a generic lens effect. This lab is edge glass, not full-frame distortion.

If a future change removes one of these choices, document why.

## QA Acceptance

Before accepting a glass change:

1. The center of the video remains visually clean.
2. The edge bends the video, not just darkens it.
3. Dispersion is visible only at the rim and does not become rainbow noise.
4. Resize does not create seams or stretched corners.
5. Slider changes update the shader immediately.
6. The console is clean.
7. `npm run test` passes.
8. `npm run build` passes.

Performance target for production:

```txt
stable 60 FPS on desktop-class GPU
no unnecessary texture update when video frame did not change
```

Lab stress target:

```txt
pixelRatio 3 should be available for visual exploration, even if not production safe
```

## Tuning Order

Disciplined order:

1. `edgeThickness`
2. `ior`
3. `edgeDarkening`
4. `dispersion`
5. `highlightStrength`
6. `pixelRatio`

Reason:

Glass shape comes before optical strength. Optical strength comes before color separation. Highlights come last.

## Future Work

Good next experiments:

- extract GLSL into dedicated shader files;
- add preset import/export;
- add FPS and GPU timing panel;
- add local video upload;
- add normal-map based icon glass;
- add optional `antialias: false` performance preset;
- add WebGPU renderer branch;
- add separate controls for rim light, lower lip, and sweep.

Do not add all of these at once. Each one should preserve the formula chain above.

## Future Agent Rule

Before changing the effect, read this document and answer three questions:

```txt
1. Which part of the optical chain am I changing?
2. Which formula or uniform controls it?
3. How will I prove that the clean center and edge-only refraction survived?
```

If the answer is unclear, the change is not ready.
