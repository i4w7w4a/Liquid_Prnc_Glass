# Lab Roadmap

This file is the working task plan for expanding the Liquid_Prnc_Glass lab without turning it into a loose demo.

The rule is simple:

```txt
one optical idea -> one tested settings contract -> one shader path -> one browser verification
```

## Current Task: Center-To-Edge Field

Status:

```txt
completed
```

Problem:

The current effect reads as a visible rectangular glass band. The new mode must let the center remain visually clean, then grow the refractive field smoothly toward the video edges.

Implementation contract:

- add a mode switch: `edge` vs `field`;
- keep `edge` as the current baseline;
- in `field` mode, compute a center distance from normalized video space;
- use `smoothstep()` and a power curve so the effect starts invisibly;
- expose controls for start radius, curve, and field strength;
- prove the preset parser accepts and rejects the new fields correctly;
- verify the old preset path still works.

Acceptance:

- center remains visually clean in `field` mode;
- no hard seam where the effect starts;
- sliders update the shader immediately;
- import/export includes the new fields;
- `npm run test` and `npm run build` pass;
- browser console is clean.

Result:

```txt
implemented
```

Implemented settings:

- `fieldEnabled`;
- `fieldStart`;
- `fieldSoftness`;
- `fieldFadeMode`;
- `fieldCurve`;
- `fieldStrength`.

Shader field:

```glsl
ellipseTravel = length(normalizedCenter)
rectTravel = max(normalizedCenter.x, normalizedCenter.y)
edgeTravel = mix(ellipseTravel, rectTravel, edgeBlend * 0.16)
fieldMask = pow(softRamp * longRamp, fieldCurve)
```

This keeps the center quiet and grows refraction toward the image bounds.

## Current Task: Master Field Fade + Signed IOR

Status:

```txt
implemented
```

Problem:

`fieldSoftness` softened the field ramp, but not every optical contribution. Strong refraction, dispersion, darkening, and highlights could still reveal a hard transition.

Implementation contract:

- compute the clean source color first;
- compute the optical color separately;
- blend the entire optical result back into the source with a final `masterFade`;
- expose two fade modes for A/B testing;
- redefine IOR as signed optical power where `0` is clean and negative values reverse refraction;
- keep older default presets visually close to the previous strength.

Implemented fade modes:

- `fieldFadeMode: 0` - optical mask;
- `fieldFadeMode: 1` - source dissolve.

Signed IOR:

```glsl
signedOpticalPower(ior) = ior * 0.18032787
```

This makes `0` neutral while keeping the old default `ior: 1.22` near its previous optical pull.

## Current Task: Integration Brief Export

Status:

```txt
implemented
```

Problem:

Copying a preset alone is not enough for another agent. The receiving project needs the numeric preset, the shader contract, the repository link, and the acceptance checks in one handoff.

Implementation contract:

- generate a reusable Markdown brief from the active preset;
- include the GitHub repository URL;
- include the master fade and signed IOR formulas;
- keep the target generic as an object/source, not one fixed media type;
- show the generated brief in the export textarea even if clipboard access is blocked;
- prove the generated brief does not use narrow source wording.

## Current Task: Source Selection + Effect Regions

Status:

```txt
implemented
```

Problem:

The lab had one hardwired demo source and one full-frame effect coverage. The next useful control layer needs to choose the source type and where the optical effect is active.

Implementation contract:

- keep the default demo source unchanged;
- allow uploaded image or uploaded motion source;
- support viewport, natural, and manual source frame sizing;
- preserve aspect by default, with an explicit unlock;
- keep upload state out of `LiquidGlassSettings`;
- add top/right/bottom/left effect region booleans to the optical preset;
- add `regionWidth` and `regionSoftness`;
- apply region masking inside the shader path, not as a CSS overlay.

Result:

- renderer now samples a generic source texture;
- field mode multiplies `masterFade` by `regionMask`;
- SDF edge mode multiplies `borderMask` by `regionMask`;
- old presets keep full coverage by default.

## Current Task: Canvas Recording Export

Status:

```txt
implemented
```

Problem:

The lab could tune a strong optical result, but the result still lived only inside the browser preview.

Implementation contract:

- record the final WebGL canvas, not the raw source;
- expose a compact export panel with FPS, Record, Stop, and Download;
- keep the recording result independent from optical preset JSON;
- prefer MP4 when the browser supports it and fall back to WebM;
- clamp FPS to a practical browser range;
- use local machine time in exported filenames.

Result:

- `canvas.captureStream()` feeds `MediaRecorder`;
- MediaRecorder options have fallback tiers for uneven browser support;
- completed recordings become a blob download link;
- export helper behavior is covered by unit tests.

Research note:

- see [Canvas Recording Export](canvas-recording-export.md).

## Current Task: Deterministic MP4 Render Export

Status:

```txt
implemented
```

Problem:

Realtime canvas recording can stutter because preview rendering and video encoding compete in the same frame budget. Lowering visual quality is not the correct primary answer.

Implementation contract:

- keep Preview Record as a quick draft tool;
- add a separate MP4 Render path;
- render frames into a hidden fixed-size WebGL canvas;
- use the same shader renderer, not a copied effect;
- build a deterministic frame timeline from duration and FPS;
- encode MP4 through WebCodecs/Mediabunny;
- expose render duration, FPS, and output size controls.

Result:

- `WebGLVideoEdgeGlassRenderer` supports `renderFrame(timeSeconds)` and `resizeTo(size)`;
- `renderMp4Export()` creates a frame-by-frame MP4 export;
- render helpers are covered by unit tests;
- Mediabunny loads lazily only when MP4 render starts.

Follow-up hardening:

- public HTTP now reports `Needs HTTPS` for MP4 render instead of a generic unsupported state;
- export renderers disable preview auto-resize and lock pixel ratio to `1`, so encoders receive one constant frame size;
- manual video seeking marks `VideoTexture` dirty before every exported frame;
- uploaded image sources use a separate `Render PNG` path with a real shader render, not a screenshot of the UI.

## Task Backlog

### 1. Shape Geometry Picker

Status:

```txt
planned
```

Add a compact shape selector with icon buttons inside a dropdown.

Required baseline shapes:

- rounded rectangle;
- circle;
- ellipse;
- diamond;
- triangle;
- hexagon.

Required irregular shapes:

- soft blob;
- wave capsule;
- chipped frame;
- petal lens;
- torn oval.

Implementation notes:

- each shape must map to a real SDF or signed field, not only a UI icon;
- icons must preview the silhouette;
- shape selection must be serializable in presets;
- irregular shapes should be deterministic first, then animated only if the flow mode needs it.

### 2. Flow Field Controls

Status:

```txt
planned
```

Add actual moving refraction, not decorative sliders.

Required controls:

- flow enabled;
- direction: left, right, up, down, clockwise, counterclockwise, from center, to center;
- speed;
- strength;
- scale;
- turbulence.

Implementation notes:

- flow must perturb the refraction offset or SDF travel, not only the highlight sweep;
- keep the current video texture update path unchanged;
- avoid noisy rainbow breakup by applying flow before dispersion sampling.

### 3. Profile Surface Mode

Status:

```txt
planned
```

Use the Kube.io Math case pack as the basis for a profile-library shader path.

Required profiles:

- squircle;
- spherical;
- concave;
- lip.

Implementation notes:

- add `profileHeight()` and `profileSlope()`;
- derive a surface normal from SDF direction plus profile slope;
- expose profile type and profile strength;
- keep `edge-sdf` as a baseline A/B mode.

### 4. Preset Slots

Status:

```txt
planned
```

Add saved preset slots after the first new shader controls stabilize.

Required behavior:

- save current settings to a named slot;
- load a slot;
- delete a slot;
- export all slots as JSON.

### 5. Performance Panel

Status:

```txt
planned
```

Add lightweight lab telemetry.

Required metrics:

- approximate FPS;
- canvas pixel size;
- pixel ratio;
- active shader mode;
- video ready state.

## Discipline

Do not add every control at once.

The lab improves when each new control changes a real shader variable and has a way to prove it worked.
