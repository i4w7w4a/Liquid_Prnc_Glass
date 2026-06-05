# Troubleshooting

## The Preview Is Black

Check:

- source file loaded;
- browser supports WebGL;
- console has no shader compile errors;
- source is not blocked by browser media policy;
- canvas has non-zero width and height.

For video, the source must reach metadata and current-data readiness before the renderer can produce useful frames.

## The Effect Looks Like A Hard Border

Check:

- `fieldSoftness` is not too low;
- `fieldCurve` is not too aggressive;
- final composition uses shared `masterFade`;
- highlights and darkening are not applied outside the fade.

## The Source Stretches

The renderer should cover-fit the source into the selected frame. If it stretches:

- inspect source aspect calculation;
- inspect `uSourceAspect`;
- inspect resize logic;
- inspect manual frame dimensions.

## Region Selection Leaves Artifacts

Region masking must affect the optical masks before color composition. If chroma or highlights remain outside selected regions, the mask is probably being applied too late.

## Recording Stutters

Preview Record is realtime. Lower:

- FPS;
- pixel ratio;
- preview size;
- browser load.

Use MP4 Render when cadence matters more than realtime speed.

## MP4 Render Fails

Check:

- browser supports WebCodecs `VideoEncoder`;
- source metadata loaded;
- selected output size is practical for the GPU;
- console has no WebGL context loss or shader errors.

## Build Fails

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Fix type errors before visual tuning. The shader can look right while the integration contract is broken.
