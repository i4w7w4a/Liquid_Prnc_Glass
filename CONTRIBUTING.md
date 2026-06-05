# Contributing to Liquid Prnc Glass

Thank you for helping improve the optical lab.

## Project Philosophy

Liquid Prnc Glass is about precise, reusable optical technique.

A good contribution makes the glass:

- more visually convincing;
- more controllable;
- more portable;
- easier to test;
- easier to understand.

## Non-Goals

- Do not turn the lab into a landing page.
- Do not replace WebGL/GLSL with CSS blur, filters, or overlays.
- Do not move shader logic into React UI.
- Do not add decorative complexity without optical value.
- Do not add controls that do not map to renderer behavior.

## Local Setup

```bash
npm install
npm run dev
```

Checks:

```bash
npm run test
npm run build
```

## Adding A New Parameter

Follow the chain:

```text
type/key -> default settings -> control -> uniform -> shader usage -> tests
```

Checklist:

- [ ] Add type/key.
- [ ] Add default value.
- [ ] Add UI control if needed.
- [ ] Pass value to the renderer.
- [ ] Add or update the shader uniform.
- [ ] Use the value in shader logic.
- [ ] Update docs.
- [ ] Add tests for parsing, normalization, formatting, or export behavior.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.

## Shader Invariants

- `ior = 0` returns a clean source.
- Negative `ior` reverses refraction direction.
- Shared masks/fades apply to all optical components.
- Region selection affects the optical result, not just final color.
- Resize updates resolution and aspect uniforms.
- Renderer disposal releases GPU resources.

## Pull Requests

Every PR should include:

- what changed;
- why it improves the optical technique, controllability, portability, export, or maintainability;
- screenshots or GIFs if visual behavior changed;
- test/build result;
- any browser/GPU caveat found during manual testing.

## Issues

Issues are for reproducible work. Questions, tuning, and early ideas belong in Discussions.

Before filing an issue, read [Issue Triage](docs/issue-triage.md). Optical artifact reports should include preset JSON, source type, browser, GPU, and screenshot or clip.

## Release Discipline

Do not prepare a release for every small edit.

Ask whether to prepare a release when the change has public meaning:

- visible optical behavior;
- new shader setting or changed preset contract;
- export, recording, or integration changes;
- meaningful presentation or documentation milestone;
- dependency/security change that affects users;
- explicit maintainer request.

When a release is requested, follow [Release Process](docs/release-process.md). Release notes should include concise ASCII identity, highlights, visual proof assets, checks, and honest limits.

## Documentation

When changing behavior, update the closest document:

- architecture: `docs/architecture.md`;
- shader contract: `docs/shader-contract.md`;
- tuning: `docs/tuning.md`;
- export: `docs/export.md`;
- integration: `docs/integration.md`;
- roadmap: `docs/roadmap.md`.
- releases: `docs/release-process.md`.
