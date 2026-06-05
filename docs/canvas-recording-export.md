# Canvas Recording Export

Date: 2026-06-05

## Goal

Export the tuned Liquid_Prnc_Glass result as a downloadable motion file without asking another tool to rebuild the effect.

The export target is the final WebGL canvas, not the raw source. This is the clean contract: if the preview shows the right optical state, recording the canvas records that same state.

## Decision

Use the browser-native path:

```txt
WebGL canvas -> canvas.captureStream(fps) -> MediaRecorder -> Blob -> download link
```

This keeps the lab lightweight and avoids adding a server renderer for the first export pass.

## Behavior

- The recording captures the current preview in real time.
- Any live setting change during recording is captured.
- Uploaded image sources export as motion files because the animated glass shader still renders frames.
- Uploaded motion sources export with the glass result visible on the canvas.
- The first implementation records visual frames only. It does not mix source audio.

## Codec Strategy

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

## FPS And Bitrate

FPS is clamped to a practical interactive range:

```txt
12..60
```

Bitrate is derived from canvas size and FPS, then clamped:

```txt
2 Mbps..20 Mbps
```

This avoids tiny low-quality exports at small sizes and avoids reckless bitrate at high `pixelRatio`.

## Filename

The filename uses local machine time, not UTC:

```txt
liquid-prnc-glass-YYYY-MM-DD-HH-mm-ss.webm
```

This matters because the operator judges exports by the time shown on the machine, not by UTC conversion.

## Limits

- Real-time recording means a 10 second export takes 10 seconds.
- Browser codec support determines whether the file becomes MP4 or WebM.
- Long high-resolution exports depend on GPU and browser memory.
- Audio is intentionally out of scope for this pass.

## Future Upgrade

The heavier path is an offline render queue:

```txt
source decode -> deterministic frame stepping -> WebGL render -> encoder worker
```

That would allow fixed-duration exports, progress bars, exact frame counts, and eventually audio muxing. It is a separate task because it changes the architecture from live preview capture to controlled rendering.

## Verification

Automated:

- `recordingExport.test.ts` covers MIME choice, fallback options, FPS clamping, extensions, and filename generation.
- `npm run test` passes.
- `npm run build` passes.

Browser:

- `Record` changes to `Stop`.
- `Stop` produces `Export ready`.
- `Download` appears with a `blob:` URL.
- Filename uses the local date.
- Browser console has no warnings or errors during the smoke check.
