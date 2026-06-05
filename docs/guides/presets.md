# Preset Guide

Presets describe optical state. They should not store local files, object URLs, viewport size, or session-only UI state.

## Default Preset

```json
{
  "ior": 1.22,
  "edgeThickness": 0.12,
  "cornerRadius": 0.025,
  "dispersion": 0.018,
  "edgeDarkening": 0.34,
  "highlightStrength": 0.72,
  "fieldStart": 0.22,
  "fieldSoftness": 0.42,
  "fieldFadeMode": 0,
  "fieldCurve": 2.4,
  "fieldStrength": 1,
  "regionTop": true,
  "regionRight": true,
  "regionBottom": true,
  "regionLeft": true,
  "regionWidth": 1,
  "regionSoftness": 0.12,
  "pixelRatio": 2,
  "fieldEnabled": false
}
```

## Tuning Order

1. Set `ior` near the direction and strength you need.
2. Adjust `edgeThickness`.
3. Add `edgeDarkening`.
4. Add restrained `dispersion`.
5. Add `highlightStrength`.
6. Tune `fieldStart` and `fieldSoftness` only when field mode is needed.
7. Use region controls to limit where the optical result appears.
8. Raise `pixelRatio` only after the look is stable.

## Clean-Source Check

Before accepting a preset, test:

```text
ior = 0
dispersion = 0
edgeDarkening = 0
highlightStrength = 0
```

The source should read clean. If ghost chroma, highlights, or darkening remain, the fade/mask contract is broken.

## Import Rules

`parseLiquidGlassPreset()` rejects:

- missing required core fields;
- non-number numeric fields;
- out-of-range numeric values;
- non-boolean region toggles;
- invalid discrete fade modes.

Legacy presets are normalized through defaults so older exported JSON remains usable.
