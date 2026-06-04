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
