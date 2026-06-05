## Summary

Describe the change.

## Why this belongs in Liquid Prnc Glass

Explain how this improves the optical technique, controllability, portability, export, or maintainability.

## Area

- [ ] Shader / optical model
- [ ] Settings / presets
- [ ] UI controls
- [ ] Export / recording
- [ ] Documentation
- [ ] Tests
- [ ] Build / tooling

## Visual changes

Attach screenshots or GIFs if the optical result changed.

## Parameter discipline

If this adds or changes a parameter:

- [ ] type/key updated
- [ ] default settings updated
- [ ] UI control updated
- [ ] renderer uniform updated
- [ ] shader usage updated
- [ ] tests updated
- [ ] docs updated

## Invariants

- [ ] `ior = 0` returns clean source
- [ ] negative `ior` reverses refraction direction where applicable
- [ ] shared mask/fade logic remains consistent
- [ ] region selection affects the optical result
- [ ] resize updates resolution/aspect uniforms

## Checks

- [ ] `npm run test`
- [ ] `npm run build`
