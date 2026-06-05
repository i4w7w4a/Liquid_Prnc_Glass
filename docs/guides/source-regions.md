# Source Regions Guide

Source selection and effect regions solve different problems.

## Source Selection

The lab supports:

- the built-in demo video;
- uploaded image sources;
- uploaded motion sources.

Source frame modes:

- `Viewport`: full-screen lab behavior.
- `Natural`: use loaded source metadata.
- `Manual`: use operator-entered dimensions.

Manual dimensions may differ from source aspect. The shader should cover-fit the source instead of stretching it.

## Effect Regions

Region controls select where the optical effect is active:

- top;
- right;
- bottom;
- left.

The region mask belongs inside the shader path.

Correct:

```text
region mask -> refraction / dispersion / darkening / highlights
```

Wrong:

```text
full optical result -> final color mask only
```

The wrong path can leave ghost chroma and highlights outside the selected strips.

## Defaults

All regions are enabled by default and `regionWidth` starts at `1`. That keeps legacy presets visually compatible.

When the UI applies a narrow region preset, it can lower `regionWidth` automatically because the user explicitly asked for a strip behavior.
