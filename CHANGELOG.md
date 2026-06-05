# Changelog

All notable changes to Liquid Prnc Glass will be documented here.

This project follows a human-readable changelog style.

## Unreleased

### Color

- Fixed the shader output color-space path so sampled source colors are written through `linearToOutputTexel` instead of raw `gl_FragColor`.
- Added a compact Color panel with exposure, brightness, contrast, saturation, temperature, tint, and gamma controls.
- Added a glowing left-rail color quick button that opens the Color panel without crowding the main control stack.
- Extended preset parsing, formatting, tests, and integration brief export for neutral color correction defaults.

### Flow

- Added Flow Field Controls with a dedicated purple quick icon and compact direction picker.
- Added `flowEnabled`, `flowMode`, `flowSpeed`, `flowStrength`, `flowScale`, `flowTurbulence`, `flowBoundaryDamping`, and `flowLayerMix` to the preset contract.
- Routed flow through shader-side optical normal perturbation before signed IOR and dispersion sampling.

### Geometry

- Added a shape geometry picker with icon previews for six regular and five irregular optical silhouettes.
- Moved edge-mode refraction from one rounded-box SDF to selectable shader-side shape distance fields.
- Added `shapeType` and `shapeWarp` preset controls with legacy preset defaults.

### Export

- Set MP4 render duration from motion source metadata by default while keeping the seconds field editable.
- Raised the deliberate MP4 render duration bound from 30 seconds to 600 seconds.

### Documentation

- Rebuilt the repository README as a human-first WebGL/GLSL optics lab introduction.
- Added visual proof assets for README presentation.
- Added documentation pages for overview, shader contract, export, integration, roadmap, preset guidance, source regions, troubleshooting, repository settings, and Russian overview.

### Repository Health

- Published GitHub roadmap issues for surface profiles, flow V2, color V2, preset slots, render hardening, diagnostics, and integration recipes.
- Added the MIT license for permissive public reuse.
- Added contribution guidelines.
- Added security policy.
- Added code of conduct.
- Added issue and pull request templates.
- Added CI workflow.
- Added citation metadata.
- Added release process rules and release note template.
- Added Dependabot and CodeQL workflows.
- Added GitHub Discussions guide and category form templates.
- Added stronger issue templates, support guidance, and issue triage rules.

## 0.1.0

Initial public lab structure:

- React 19 + TypeScript + Vite shell.
- Three.js renderer bridge.
- GLSL edge refraction shader.
- Source texture support for video and image sources.
- Preset settings and parser.
- Source frame modes and effect regions.
- Canvas recording and deterministic MP4 render export paths.
- Integration brief generator.
