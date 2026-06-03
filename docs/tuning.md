# Tuning

The lab is designed to produce a JSON preset. The preset is the contract.

## Controls

### IOR

Optical strength. Start around `1.12-1.28`.

High values create aggressive bending. This can look premium on bright hair and metallic edges, but ugly on flat dark footage.

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

## Tuning Discipline

Use this order:

1. Tune edge thickness until the glass band has the right size.
2. Raise IOR until the edge bends but does not tear.
3. Add edge darkening until the boundary feels physical.
4. Add small dispersion.
5. Add highlight strength.
6. Raise pixel ratio only after the visual style is right.

## Bad Signs

- The edge turns into rainbow noise.
- The center of the video feels distorted.
- The frame reads as a glowing border instead of glass.
- Low-contrast parts produce visible rectangular artifacts.
- The panel feels responsive but the video stutters.

If these appear, reduce `dispersion`, `highlightStrength`, or `edgeThickness`.
