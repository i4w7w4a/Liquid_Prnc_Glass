# Tuning

The lab is designed to produce a JSON preset. The preset is the contract.

Use the UI to tune, then copy either:

- the raw preset JSON;
- the generated integration brief when another project needs the full shader contract.

## Controls

### IOR

Optical strength. Start around `1.12-1.28`.

High values create aggressive bending. This can look premium on bright hair and metallic edges, but ugly on flat dark footage.

`0` is the clean-source path. Negative values reverse refraction direction.

### Edge thickness

Width of the glass band around the video.

If it is too low, the effect is invisible. If it is too high, the whole frame feels warped.

### Corner radius

SDF rounding. Use low values for a cinematic rectangular video frame.

### Dispersion

Chromatic split. Keep small.

Good range:

```txt
0.008 - 0.028
```

Stress range:

```txt
0.04+
```

### Edge darkening

Simulates absorption through thick glass.

This is often what makes the edge feel physical instead of just colorful.

### Highlight strength

Controls rim, lower lip and sweep highlights.

Raise last.

### Pixel ratio

Render quality.

```txt
1    low
2    high-end default
3    stress
```

### Center field

Field mode lets the center remain clean while the optical result grows toward the edges.

Tune in this order:

1. `fieldStart`
2. `fieldSoftness`
3. `fieldCurve`
4. `fieldStrength`

If the transition becomes visible as a hard line, reduce strength or soften the fade before touching dispersion.

### Effect regions

Use top, right, bottom, and left regions to limit where the optical effect appears.

Region controls are shader-side masks. They should affect refraction, dispersion, darkening, and highlights together.

## Tuning Discipline

Use this order:

1. Tune edge thickness until the glass band has the right size.
2. Raise IOR until the edge bends but does not tear.
3. Add edge darkening until the boundary feels physical.
4. Add small dispersion.
5. Add highlight strength.
6. Enable field mode only if the edge band is not enough.
7. Limit regions if the effect should belong to only part of the source.
8. Raise pixel ratio only after the visual style is right.

## Bad Signs

- The edge turns into rainbow noise.
- The center of the video feels distorted.
- The frame reads as a glowing border instead of glass.
- Low-contrast parts produce visible rectangular artifacts.
- The panel feels responsive but the video stutters.

If these appear, reduce `dispersion`, `highlightStrength`, or `edgeThickness`.

## Verification

Before accepting a preset:

```bash
npm run test
npm run build
```

Manual checks:

- `ior = 0` returns a clean source.
- Negative `ior` reverses direction.
- The center-to-edge field has no hard start line.
- Region selection leaves no ghost chroma or highlights outside selected strips.
- Exported video matches the previewed shader result.
