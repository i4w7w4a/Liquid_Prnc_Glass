# Research Packs

This lab stores research as case packs.

Each pack must answer:

```txt
1. What problem does this research solve?
2. Which formulas or rendering ideas does it preserve?
3. How does it relate to the current shader?
4. What should a future implementation prove before it is accepted?
```

## Packs

### Case Pack 01: Liquid Glass Over Video

File:

```txt
docs/research-liquid-glass.md
```

Source:

```txt
https://gemini.google.com/share/dd8d46024d72
```

Purpose:

```txt
Documents the current edge-video glass shader: SDF edge mask, SDF normal, UV refraction, RGB dispersion, video texture updates, renderer architecture, and QA rules.
```

### Case Pack 02: Kube.io Math On WebGL GPU

File:

```txt
docs/case-kube-io-math-webgl.md
```

Source:

```txt
https://gemini.google.com/share/adab45a6c003
```

Purpose:

```txt
Preserves a more general profile-library model: squircle, spherical, concave, and lip bevel profiles; profile derivative; 3D surface normal; specular angle; and a path toward universal refractive materials.
```

## Rule

New research does not replace old research by default.

It becomes another instrument in the lab. Only implementation and verification decide which instrument should move into production.
