# Roadmap

The working roadmap lives in [Lab Roadmap](lab-roadmap.md). This page is the public summary.

## Completed

- Center-to-edge field mode.
- Master field fade.
- Signed IOR where `0` is neutral.
- Integration brief export.
- Uploaded image and video sources.
- Effect regions for top, right, bottom, and left strips.
- Preview recording through MediaRecorder.
- Deterministic MP4 render export through WebCodecs/Mediabunny.
- Shape geometry picker with regular and irregular SDF silhouettes.
- Flow Field Controls that perturb the optical normal before signed IOR and dispersion.

## Planned

### Profile Surface Mode

Use the Kube.io Math research pack as a path toward profile-library refraction:

- squircle;
- spherical;
- concave;
- lip.

### Preset Slots

Allow named saved presets after the shader controls stabilize.

### Performance Panel

Expose lightweight lab telemetry:

- approximate FPS;
- canvas pixel size;
- pixel ratio;
- active shader mode;
- source ready state.

## Discipline

Do not add every control at once. One optical idea should produce one tested settings contract, one shader path, and one browser verification pass.
