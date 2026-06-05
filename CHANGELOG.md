# Changelog

All notable changes to Liquid Prnc Glass will be documented here.

This project follows a human-readable changelog style.

## Unreleased

Nothing yet.

## 0.2.0 - 2026-06-06

### Color

- Added explicit `sRGBTransferEOTF` decode for moving media textures before optical composition so the neutral source stays close to the original.
- Tightened `brightness` from a destructive `-1..1` lift to a fine `-0.25..0.25` tuning range with a `0.005` step.
- Fixed the shader output color-space path so sampled source colors are written through `linearToOutputTexel` instead of raw `gl_FragColor`.
- Fixed a shader compile regression caused by duplicating Three.js color-space parser functions in the custom fragment shader.
- Added a compact Color panel with exposure, brightness, contrast, saturation, temperature, tint, and gamma controls.
- Added a glowing left-rail color quick button that opens the Color panel without crowding the main control stack.
- Extended preset parsing, formatting, tests, and integration brief export for neutral color correction defaults.

### Source

- Moved starter demo playback control out of the WebGL renderer and into the React source layer with autoplay retry on focus and visibility return.
- Added a source-panel button to swap the starter MP4 demo for a still poster, reducing decode load when motion is not needed.
- Added a restore path that remounts the starter motion source so the demo can recover from a paused or blocked state.

### Controls

- Changed the lower left-rail quick button into a one-click collapse command for all control groups.
- Changed the color quick button to collapse the panel first and then open only Color controls.

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
- Added PNG frame render support for still sources.

### Documentation

- Updated project links and integration brief output to use the HTTPS public site.
- Expanded the generated integration brief with readable values for core optics, center field, regions, shape, flow, and color.
- Added the source color-space decode rule to the integration handoff.
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
