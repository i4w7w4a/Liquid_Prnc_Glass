import type { LiquidGlassSettings } from './settings'
import { serializeLiquidGlassPreset } from './settings'

const liquidGlassRepositoryUrl = 'https://github.com/i4w7w4a/Liquid_Prnc_Glass'

function getFadeModeLabel(fieldFadeMode: number) {
  return fieldFadeMode === 1 ? 'source dissolve' : 'optical mask'
}

export function generateLiquidGlassIntegrationBrief(settings: LiquidGlassSettings) {
  const presetJson = serializeLiquidGlassPreset(settings)
  const fadeModeLabel = getFadeModeLabel(settings.fieldFadeMode)

  return `# Liquid_Prnc_Glass integration brief

Нужно перенести на сайт эффект Liquid_Prnc_Glass и применить его к объекту, на котором нужен оптический слой.

Источник лаборатории и скачивание:
${liquidGlassRepositoryUrl}

Важно:
- это не CSS filter, не blur и не декоративный overlay;
- эффект должен быть WebGL/GLSL pass поверх исходного объекта;
- применяемый объект может быть изображением, canvas, DOM/WebGL source или другим rendered source;
- visual result должен совпасть с лабораторным preset ниже.

Preset:

\`\`\`json
${presetJson}
\`\`\`

Current fade mode:
${settings.fieldFadeMode} - ${fadeModeLabel}

Core contract:
- центр остается чистым, эффект появляется постепенно к краям;
- жесткая линия старта недопустима;
- IOR signed: 0 означает чистый исходник, плюс и минус меняют направление преломления;
- refraction, dispersion, darkening и highlights должны гаситься общей masterFade;
- нельзя оставлять chroma, highlight или darkening вне final fade.

Signed IOR:

\`\`\`glsl
float signedOpticalPower(float ior) {
  return ior * 0.18032787;
}
\`\`\`

Center-to-edge field:

\`\`\`glsl
vec2 centerVector = (vUv - 0.5) * aspectCorrection;

vec2 normalizedCenter = vec2(
  abs(centerVector.x) / max(0.5 * aspect, 0.001),
  abs(centerVector.y) / 0.5
);

float ellipseTravel = length(normalizedCenter);
float rectTravel = max(normalizedCenter.x, normalizedCenter.y);
float edgeBlend = smoothstep(0.72, 1.18, ellipseTravel);
float edgeTravel = mix(ellipseTravel, rectTravel, edgeBlend * 0.16);

float fieldStart = clamp(uFieldStart, 0.0, 0.9);
float fieldSoftness = clamp(uFieldSoftness, 0.04, 1.0);
float fieldCurve = clamp(uFieldCurve, 0.35, 6.0);

float fadeProgress = clamp(
  (edgeTravel - fieldStart) / max(fieldSoftness, 0.001),
  0.0,
  1.0
);

float longRamp = smoothstep(
  max(0.0, fieldStart - fieldSoftness * 0.45),
  1.18,
  edgeTravel
);

float maskFade = pow(
  smoothstep(0.0, 1.0, fadeProgress) * longRamp,
  fieldCurve
);

float dissolveFade = pow(
  smootherstep01(fadeProgress),
  max(0.6, fieldCurve * 0.82)
) * longRamp;

float masterFade = mix(maskFade, dissolveFade, step(0.5, uFieldFadeMode));
\`\`\`

Refraction:

\`\`\`glsl
vec2 normal = length(centerVector) > 0.00001 ? normalize(centerVector) : vec2(0.0);

float pull =
  signedOpticalPower(uIOR)
  * masterFade
  * uFieldStrength
  * (0.055 + thickness * 0.38);

vec2 refractOffset = normal * pull / aspectCorrection;
\`\`\`

Dispersion sampling:

\`\`\`glsl
opticalColor.r = sampleSource(vUv + refractOffset * (1.0 + chroma * 3.5)).r;
opticalColor.g = sampleSource(vUv + refractOffset).g;
opticalColor.b = sampleSource(vUv + refractOffset * (1.0 - chroma * 3.5)).b;
\`\`\`

Final composition rule:

\`\`\`glsl
finalColor = mix(baseColor, opticalColor, masterFade);
\`\`\`

Acceptance:
- preset imports without changing numeric values;
- ior = 0 returns a clean source object;
- negative ior reverses refraction direction;
- center-to-edge transition has no visible hard cut;
- source object keeps cover-fit sizing inside its container;
- resize updates resolution and aspect uniforms;
- browser console has no shader/WebGL errors.
`
}
