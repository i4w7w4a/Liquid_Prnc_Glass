# Export Architecture

Date: 2026-06-05

## Goal

Export the tuned Liquid_Prnc_Glass result as a downloadable motion file without asking another tool to rebuild the effect.

The export target is the shader-rendered result, not the raw source. This is the clean contract: if the lab settings define the right optical state, export must render that same optical state.

## Two Export Paths

The lab now has two different tools because they solve different problems.

### 1. Preview Record

This is the browser-native realtime path:


```txt
WebGL canvas -> canvas.captureStream(fps) -> MediaRecorder -> Blob -> download link
```

It is useful for quick drafts and checks. It is not the final quality path.

Root weakness:

```txt
preview render + WebGL + UI + realtime encoder all compete in the same moment
```

At high canvas size or high `pixelRatio`, this can stutter because the browser must render and encode faster than time passes.

### 2. MP4 Render

This is the quality path:

```txt
timeline frames -> hidden fixed-size WebGL canvas -> CanvasSource -> Mediabunny MP4 output
```

It renders frame-by-frame with explicit timestamps. The file is allowed to take longer than realtime. That is the point: quality and cadence should not depend on whether the preview loop kept up.

The render path uses:

- the same GLSL shader;
- the same source texture contract;
- a fixed export size: Source, 720p, or 1080p;
- fixed FPS and duration;
- MP4 output through WebCodecs/Mediabunny.

## Behavior

- Preview Record captures the current preview in realtime.
- MP4 Render creates a separate hidden render canvas and writes exact frames.
- Uploaded image sources render as motion files because the animated shader still advances over time.
- Uploaded motion sources are sampled frame-by-frame by seeking the source.
- The current implementation records visual frames only. It does not mix source audio.

## Preview Record Codec Strategy

Browsers differ. The lab tries formats in this order:

```txt
video/mp4;codecs=h264
video/webm;codecs=vp9
video/webm;codecs=vp8
video/webm
```

If a browser says nothing is supported, the lab still attempts `video/webm`. If the preferred constructor fails, it falls back to:

```txt
{ videoBitsPerSecond }
{}
```

The user sees one simple action: `Record`, then `Stop`, then `Download`.

## MP4 Render Timing

MP4 Render builds a deterministic timeline:

```txt
frameIndex -> timestamp seconds -> shader uTime -> encoded sample
```

Frame timestamps are computed in microseconds first, then passed to the canvas source in seconds. This avoids accumulated floating point drift.

Render bounds:

```txt
duration: 1..30 seconds
fps: 24..60
```

Export dimensions are forced to even numbers because video encoders expect encoder-safe frame dimensions.

## Filename

Preview Record uses:

```txt
liquid-prnc-glass-YYYY-MM-DD-HH-mm-ss.webm
```

MP4 Render uses:

```txt
liquid-prnc-glass-render-YYYY-MM-DD-HH-mm-ss.mp4
```

This matters because the operator judges exports by the time shown on the machine, not by UTC conversion.

## Limits

- Preview Record can stutter under realtime load.
- MP4 Render can take longer than the final clip duration.
- MP4 Render depends on browser WebCodecs support.
- Long high-resolution exports depend on GPU, encoder, and browser memory.
- Audio is intentionally out of scope for this pass.

## Future Upgrade

The heavier next path is an offline render queue with cancellation and optional audio muxing:

```txt
source decode -> deterministic frame stepping -> WebGL render -> encoder worker
```

That would allow background workers, cancellation, larger exports, and eventually source audio muxing.

## Verification

Automated:

- `recordingExport.test.ts` covers MIME choice, fallback options, FPS clamping, extensions, and filename generation.
- `renderExport.test.ts` covers MP4 render duration, FPS, encoder-safe output size, frame timeline, bitrate, and filenames.
- `npm run test` passes.
- `npm run build` passes.

Browser:

- `Record` changes to `Stop`.
- `Stop` produces `Export ready`.
- `Download` appears with a `blob:` URL.
- Filename uses the local date.
- `Render MP4` with a 1 second smoke duration produces `MP4 ready`.
- `Download MP4` appears with a `blob:` URL and `.mp4` filename.
- Browser console has no warnings or errors during the smoke checks.
