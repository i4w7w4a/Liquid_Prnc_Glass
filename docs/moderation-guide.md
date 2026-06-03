# Moderation Guide

This guide is for maintaining the project without turning it into a tangled experiment.

## Safe Files To Edit

For look and tuning:

```txt
src/liquid-glass/settings.ts
src/styles.css
```

For shader behavior:

```txt
src/liquid-glass/WebGLVideoEdgeGlassRenderer.ts
```

For UI layout:

```txt
src/App.tsx
```

For demo media:

```txt
src/assets/demo-video.web.mp4
src/assets/demo-poster.png
```

## Do Not Mix Concerns

Rules:

- Do not put Three.js setup inside `App.tsx`.
- Do not put slider logic inside the renderer.
- Do not put DOM UI into the shader.
- Do not add CSS blur as a substitute for shader refraction.
- Do not add new controls unless they map to real renderer settings.

## Adding A New Shader Parameter

Follow the chain:

1. Add key to `LiquidGlassSettingKey`.
2. Add default in `defaultLiquidGlassSettings`.
3. Add slider in `liquidGlassControls`.
4. Add uniform in `WebGLVideoEdgeGlassRenderer.ts`.
5. Update `updateSettings()`.
6. Use the uniform in GLSL.
7. Add or update a test if the setting has formatting or serialization logic.

## Replacing The Video

Replace:

```txt
src/assets/demo-video.web.mp4
src/assets/demo-poster.png
```

Keep the poster visually close to the first frame. It prevents ugly loading flashes.

## Build Check

Before pushing:

```bash
npm run test
npm run build
```

If build fails, fix types first. If the effect looks wrong but build passes, inspect the shader and settings chain.

## Future Improvements

Good next steps:

- extract GLSL into separate shader files;
- add preset import/export;
- add FPS meter;
- add media upload for local tuning;
- add multiple saved preset slots;
- add mobile-specific preset caps;
- add WebGPU renderer experiment.

Do not add all of this at once. One clean improvement at a time.
