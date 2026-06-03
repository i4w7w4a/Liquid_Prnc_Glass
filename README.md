# Liquid_Prnc_Glass

High-end WebGL video edge glass lab.

This project renders a video through Three.js, turns the video into a GPU texture, and applies a GLSL SDF refraction shader only around the video edges. It is built as a small standalone playground so the effect can be tuned, saved as JSON, and later reused inside other projects.

## Scope

This repository is only the laboratory for the glass technique.

It is not a website clone. It does not contain the CORAX page structure, Hero/About stages, navigation system, deployment scripts, or production site logic. Keep it that way. The purpose is to improve and preserve one reusable technique: WebGL liquid glass over video.

## What It Does

- Uses `THREE.VideoTexture` as the visual source.
- Keeps the center of the video clean.
- Computes a signed distance field around the video edge.
- Refracts UV coordinates along the edge normal.
- Splits RGB channels for controlled chromatic dispersion.
- Adds edge darkening and rim/lip highlights.
- Exposes live sliders for tuning.
- Prints the current preset as JSON.

No old CSS/SVG glass tricks are used for the core effect. The glass is a WebGL shader.

## Quick Start

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:7474/
```

Build:

```bash
npm run build
```

Test:

```bash
npm run test
```

## Project Structure

```txt
src/
  App.tsx
  styles.css
  assets/
    demo-video.web.mp4
    demo-poster.png
    Disket-Mono-Regular.ttf
    Disket-Mono-Bold.ttf
  liquid-glass/
    WebGLVideoEdgeGlass.tsx
    WebGLVideoEdgeGlassRenderer.ts
    settings.ts
    settings.test.ts
    index.ts
docs/
  architecture.md
  shader.md
  tuning.md
  moderation-guide.md
```

## Tuning

Use the right panel. When the result is good, copy the JSON from `Current preset`.

Default preset:

```json
{
  "ior": 1.22,
  "edgeThickness": 0.12,
  "cornerRadius": 0.025,
  "dispersion": 0.018,
  "edgeDarkening": 0.34,
  "highlightStrength": 0.72,
  "pixelRatio": 2
}
```

Good tuning order:

1. `edgeThickness`
2. `ior`
3. `edgeDarkening`
4. `dispersion`
5. `highlightStrength`
6. `pixelRatio`

Do not start by maxing `dispersion` and `highlightStrength`. That creates noise, not glass.

## Replacing The Demo Video

Replace:

```txt
src/assets/demo-video.web.mp4
src/assets/demo-poster.png
```

Then restart the dev server if Vite does not pick up the binary file change.

Use a video with good edge contrast. Dark, flat footage makes refraction harder to judge.

## Reusing The Effect

Import the component:

```tsx
import { WebGLVideoEdgeGlass } from './liquid-glass'
import type { LiquidGlassSettings } from './liquid-glass'
```

Use it:

```tsx
const settings: LiquidGlassSettings = {
  ior: 1.22,
  edgeThickness: 0.12,
  cornerRadius: 0.025,
  dispersion: 0.018,
  edgeDarkening: 0.34,
  highlightStrength: 0.72,
  pixelRatio: 2,
}

<WebGLVideoEdgeGlass src={videoSrc} poster={posterSrc} settings={settings} />
```

The component owns a hidden video element and a canvas. The renderer owns the Three.js lifecycle.

## Documentation

- [Architecture](docs/architecture.md)
- [Shader](docs/shader.md)
- [Tuning](docs/tuning.md)
- [Moderation Guide](docs/moderation-guide.md)
