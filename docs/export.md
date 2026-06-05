# Export

Liquid Prnc Glass exports the shader-rendered result, not the raw source.

There are two export paths because they solve different problems.

## Preview Record

Preview Record is the browser-native realtime path:

```text
WebGL canvas -> canvas.captureStream(fps) -> MediaRecorder -> Blob -> download
```

It is useful for quick checks and drafts. It depends on realtime browser rendering and encoding, so it can stutter on heavy settings or high pixel ratios.

## MP4 Render

MP4 Render is the quality path:

```text
timeline frames -> hidden fixed-size WebGL canvas -> CanvasSource -> MP4 output
```

It renders frame-by-frame with explicit timestamps. It can take longer than the final clip duration because the goal is deterministic cadence, not realtime speed.

Implementation:

- `src/liquid-glass/renderExport.ts` builds frame timing, sizes, bitrate, and filenames.
- `src/liquid-glass/renderMp4Export.ts` creates the hidden canvas and encodes MP4 through WebCodecs/Mediabunny.
- `src/liquid-glass/recordingExport.ts` handles realtime MediaRecorder fallback logic.

## Export Bounds

MP4 render constraints:

```text
duration: 1..600 seconds
fps: 24..60
size: source, 720p, or 1080p
```

When a motion source exposes valid metadata, the lab sets the default render duration from the source duration. The field remains editable, so shorter smoke renders and deliberate long renders are still manual operator choices.

Preview recording constraints:

```text
fps: 12..60
format: mp4 when supported, otherwise webm fallback
```

## Acceptance Checks

- Exported result shows the shader output.
- `ior = 0` exports a clean source path.
- MP4 filenames use local machine time.
- Output dimensions are encoder-safe even numbers.
- Browser console has no WebGL or shader errors during a smoke export.

Detailed research note: [Canvas Recording Export](canvas-recording-export.md).
