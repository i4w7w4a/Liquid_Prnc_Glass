import * as THREE from 'three'
import type { LiquidGlassSettings } from './settings'
import type { SourceSize } from './sourceLayout'

type RenderSourceElement = HTMLImageElement | HTMLVideoElement

type VideoSourceElement = HTMLVideoElement & {
  cancelVideoFrameCallback?: (handle: number) => void
  requestVideoFrameCallback?: (callback: () => void) => number
}

type RendererOptions = {
  autoResize?: boolean
  canvas: HTMLCanvasElement
  fixedPixelRatio?: number
  preserveDrawingBuffer?: boolean
  settings: LiquidGlassSettings
  source: RenderSourceElement
  sourceNaturalSize?: SourceSize
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform sampler2D uSourceTexture;
uniform vec2 uResolution;
uniform float uSourceAspect;
uniform float uTime;
uniform float uIOR;
uniform float uBorderThickness;
uniform float uCornerRadius;
uniform float uDispersion;
uniform float uEdgeDarkening;
uniform float uHighlightStrength;
uniform float uExposure;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform float uTint;
uniform float uGamma;
uniform float uFieldEnabled;
uniform float uFieldStart;
uniform float uFieldSoftness;
uniform float uFieldFadeMode;
uniform float uFieldCurve;
uniform float uFieldStrength;
uniform vec4 uRegionEdges;
uniform float uRegionWidth;
uniform float uRegionSoftness;
uniform float uShapeType;
uniform float uShapeWarp;
uniform float uFlowEnabled;
uniform float uFlowMode;
uniform float uFlowSpeed;
uniform float uFlowStrength;
uniform float uFlowScale;
uniform float uFlowTurbulence;
uniform float uFlowBoundaryDamping;
uniform float uFlowLayerMix;

varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdEllipse(vec2 p, vec2 ab) {
  p = abs(p);
  ab = max(ab, vec2(0.001));
  float k0 = length(p / ab);
  float k1 = length(p / (ab * ab));
  return k0 * (k0 - 1.0) / max(k1, 0.001);
}

float sdDiamond(vec2 p, float r) {
  p = abs(p);
  return (p.x + p.y - r) * 0.70710678;
}

float sdEquilateralTriangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;

  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }

  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

float stableAngularWarp(vec2 p, float seed) {
  float angle = atan(p.y, p.x);
  return
    sin(angle * 3.0 + seed) * 0.52 +
    sin(angle * 5.0 - seed * 1.7) * 0.28 +
    sin(angle * 9.0 + seed * 0.6) * 0.16;
}

float directionalFlowPotential(vec2 p, vec2 direction, float time, float scale) {
  vec2 dir = normalize(direction);
  float primary = sin(dot(p, dir) * scale * 6.2831853 + time);
  float secondary = sin(dot(p, vec2(-dir.y, dir.x)) * scale * 4.712389 - time * 0.73);
  return primary + secondary * 0.28;
}

float flowPotential(vec2 p, float time) {
  float mode = floor(uFlowMode + 0.5);
  float scale = clamp(uFlowScale, 0.25, 8.0);
  float speed = clamp(uFlowSpeed, 0.0, 4.0);
  float turbulence = clamp(uFlowTurbulence, 0.0, 1.0);
  float layerMix = clamp(uFlowLayerMix, 0.0, 1.0);
  float phase = time * speed;

  if (mode < 0.5) {
    return 0.0;
  }

  float base = 0.0;

  if (mode < 1.5) {
    base = directionalFlowPotential(p, vec2(-1.0, 0.0), phase, scale);
  } else if (mode < 2.5) {
    base = directionalFlowPotential(p, vec2(1.0, 0.0), phase, scale);
  } else if (mode < 3.5) {
    base = directionalFlowPotential(p, vec2(0.0, 1.0), phase, scale);
  } else if (mode < 4.5) {
    base = directionalFlowPotential(p, vec2(0.0, -1.0), phase, scale);
  } else if (mode < 6.5) {
    float turn = mode < 5.5 ? 1.0 : -1.0;
    float angle = atan(p.y, p.x);
    float radius = length(p);
    base = sin(angle * 3.0 + radius * scale * 5.0 + phase * turn);
  } else if (mode < 8.5) {
    float sourceSign = mode < 7.5 ? -1.0 : 1.0;
    base = sin(length(p) * scale * 7.0 + phase * sourceSign);
  } else if (mode < 9.5) {
    float a = sin(p.x * scale * 4.1 + phase);
    float b = sin(p.y * scale * 5.3 - phase * 0.82);
    float c = sin((p.x - p.y) * scale * 3.7 + phase * 0.41);
    base = a * 0.46 + b * 0.36 + c * 0.28;
  } else if (mode < 10.5) {
    base = sin((p.x + p.y * 0.36) * scale * 6.0 + phase) +
      sin(p.y * scale * 3.2 - phase * 0.5) * 0.35;
  } else {
    base = sin(p.x * scale * 5.2) * sin(phase) +
      sin(p.y * scale * 3.6 + phase * 0.25) * 0.25;
  }

  float layer = sin(dot(p, vec2(0.73, -0.61)) * scale * 8.4 - phase * 1.37) +
    sin(dot(p, vec2(-0.31, 0.92)) * scale * 6.2 + phase * 0.67) * 0.42;
  float organic = stableAngularWarp(p + vec2(sin(phase * 0.17), cos(phase * 0.13)) * 0.08, 3.7);

  return mix(base, layer, layerMix * 0.72) + organic * turbulence * 0.36;
}

vec2 flowGradient(vec2 p, float time) {
  float mode = floor(uFlowMode + 0.5);

  if (uFlowEnabled < 0.5 || mode < 0.5 || uFlowStrength <= 0.0) {
    return vec2(0.0);
  }

  vec2 eps = vec2(0.0022, 0.0);
  float dX = flowPotential(p + eps.xy, time) - flowPotential(p - eps.xy, time);
  float dY = flowPotential(p + eps.yx, time) - flowPotential(p - eps.yx, time);
  vec2 grad = vec2(dX, dY) / (eps.x * 2.0);

  if (mode > 4.5 && mode < 6.5) {
    float turn = mode < 5.5 ? 1.0 : -1.0;
    grad = vec2(-grad.y, grad.x) * turn;
  } else if (mode > 8.5 && mode < 9.5) {
    grad = vec2(-grad.y, grad.x);
  }

  return grad * 0.055;
}

vec2 applyFlowToNormal(vec2 baseNormal, vec2 p, float opticalMask) {
  float strength = clamp(uFlowStrength, 0.0, 1.5);
  float boundaryDamping = clamp(uFlowBoundaryDamping, 0.0, 1.0);
  float mask = clamp(opticalMask, 0.0, 1.0);
  float dampedMask = mask * mix(1.0, smoothstep(0.0, 1.0, mask), boundaryDamping);
  vec2 flowNormal = baseNormal + flowGradient(p, uTime) * strength * dampedMask;

  return length(flowNormal) > 0.00001 ? normalize(flowNormal) : baseNormal;
}

float shapeDistance(vec2 p, vec2 innerSize, float radius) {
  float shapeType = floor(uShapeType + 0.5);
  float warp = clamp(uShapeWarp, 0.0, 1.0);
  float baseRadius = max(0.001, min(innerSize.x, innerSize.y));
  float warpScale = baseRadius * 0.105 * warp;

  if (shapeType < 0.5) {
    return sdRoundedBox(p, innerSize, radius);
  }

  if (shapeType < 1.5) {
    return length(p) - baseRadius;
  }

  if (shapeType < 2.5) {
    return sdEllipse(p, innerSize);
  }

  if (shapeType < 3.5) {
    return sdDiamond(p, baseRadius * 1.28);
  }

  if (shapeType < 4.5) {
    return sdEquilateralTriangle(p + vec2(0.0, baseRadius * 0.12), baseRadius * 1.2);
  }

  if (shapeType < 5.5) {
    return sdHexagon(p, baseRadius * 1.02);
  }

  if (shapeType < 6.5) {
    return sdEllipse(p, innerSize * vec2(0.92, 0.96)) +
      stableAngularWarp(p, 0.4) * warpScale;
  }

  if (shapeType < 7.5) {
    float capsule = sdRoundedBox(p, vec2(innerSize.x * 0.88, innerSize.y * 0.56), innerSize.y * 0.46);
    float wave = sin(p.x * 12.0 + sin(p.y * 3.0) * 0.8) * warpScale * 1.05;
    return capsule + wave;
  }

  if (shapeType < 8.5) {
    float chipped = sdRoundedBox(p, innerSize * vec2(0.96, 0.9), max(0.0, radius * 0.45));
    float chip = stableAngularWarp(p, 2.15) * warpScale * 1.25;
    return chipped + floor(chip / max(warpScale * 0.32, 0.001)) * warpScale * 0.32;
  }

  if (shapeType < 9.5) {
    float angle = atan(p.y, p.x);
    float petal = cos(angle * 2.0) * warpScale * 1.45;
    return sdEllipse(p, innerSize * vec2(0.78, 1.02)) - petal;
  }

  return sdEllipse(p, innerSize * vec2(0.9, 0.98)) +
    stableAngularWarp(p, 4.2) * warpScale * 1.35;
}

vec2 coverUv(vec2 uv) {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float sourceAspect = max(uSourceAspect, 0.01);
  vec2 scale = vec2(1.0);

  if (canvasAspect > sourceAspect) {
    scale.y = sourceAspect / canvasAspect;
  } else {
    scale.x = canvasAspect / sourceAspect;
  }

  return (uv - 0.5) * scale + 0.5;
}

vec3 sampleSource(vec2 uv) {
  return texture2D(uSourceTexture, clamp(coverUv(uv), vec2(0.001), vec2(0.999))).rgb;
}

vec3 sampleDispersedSource(vec2 uv, vec2 refractOffset, float chroma) {
  vec3 color;
  color.r = sampleSource(uv + refractOffset * (1.0 + chroma * 3.5)).r;
  color.g = sampleSource(uv + refractOffset).g;
  color.b = sampleSource(uv + refractOffset * (1.0 - chroma * 3.5)).b;
  return color;
}

vec3 applyColorGrade(vec3 color) {
  color = max(color, vec3(0.0));
  color *= exp2(clamp(uExposure, -2.0, 2.0));
  color += vec3(clamp(uBrightness, -1.0, 1.0));
  color = (color - 0.5) * clamp(uContrast, 0.0, 2.0) + 0.5;

  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, clamp(uSaturation, 0.0, 2.0));

  float temperature = clamp(uTemperature, -1.0, 1.0);
  float tint = clamp(uTint, -1.0, 1.0);
  color += vec3(temperature * 0.055, tint * 0.045, -temperature * 0.055);

  color = max(color, vec3(0.0));
  color = pow(color, vec3(1.0 / clamp(uGamma, 0.4, 2.4)));

  return clamp(color, 0.0, 1.0);
}

void writeOutputColor(vec3 color) {
  gl_FragColor = linearToOutputTexel(vec4(applyColorGrade(color), 1.0));
}

float smootherstep01(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float signedOpticalPower(float ior) {
  return ior * 0.18032787;
}

float stripMask(float distanceToEdge, float width, float softness) {
  float innerStart = max(0.0, width - softness);
  return 1.0 - smoothstep(innerStart, width, distanceToEdge);
}

float effectRegionMask(vec2 uv) {
  float selected = max(max(uRegionEdges.x, uRegionEdges.y), max(uRegionEdges.z, uRegionEdges.w));

  if (selected < 0.5) {
    return 0.0;
  }

  float width = clamp(uRegionWidth, 0.0, 1.0);
  float softness = clamp(uRegionSoftness, 0.001, 0.5);
  float top = stripMask(1.0 - uv.y, width, softness) * uRegionEdges.x;
  float right = stripMask(1.0 - uv.x, width, softness) * uRegionEdges.y;
  float bottom = stripMask(uv.y, width, softness) * uRegionEdges.z;
  float left = stripMask(uv.x, width, softness) * uRegionEdges.w;

  return clamp(max(max(top, right), max(bottom, left)), 0.0, 1.0);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 aspectCorrection = vec2(aspect, 1.0);
  vec2 p = (vUv - 0.5) * aspectCorrection;
  float thickness = clamp(uBorderThickness, 0.001, 0.32);
  float radius = clamp(uCornerRadius, 0.0, 0.34);
  vec2 innerSize = vec2(max(0.001, 0.5 * aspect - thickness * aspect), max(0.001, 0.5 - thickness));
  float d = shapeDistance(p, innerSize, radius);
  float chroma = clamp(uDispersion, 0.0, 0.12);
  vec2 lightDirection = normalize(vec2(-0.46, -0.89));
  float regionMask = effectRegionMask(vUv);

  if (uFieldEnabled > 0.5) {
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
    float fadeProgress = clamp((edgeTravel - fieldStart) / max(fieldSoftness, 0.001), 0.0, 1.0);
    float longRamp = smoothstep(max(0.0, fieldStart - fieldSoftness * 0.45), 1.18, edgeTravel);
    float maskFade = pow(smoothstep(0.0, 1.0, fadeProgress) * longRamp, fieldCurve);
    float dissolveFade = pow(smootherstep01(fadeProgress), max(0.6, fieldCurve * 0.82)) * longRamp;
    float masterFade = mix(maskFade, dissolveFade, step(0.5, uFieldFadeMode)) * regionMask;

    vec2 normal = length(centerVector) > 0.00001 ? normalize(centerVector) : vec2(0.0);
    vec2 opticalNormal = applyFlowToNormal(normal, p, masterFade);
    float fieldStrength = clamp(uFieldStrength, 0.0, 2.5);
    float pull = signedOpticalPower(uIOR) * masterFade * fieldStrength * (0.055 + thickness * 0.38);
    vec2 refractOffset = opticalNormal * pull / aspectCorrection;
    vec3 baseColor = sampleSource(vUv);
    vec3 opticalColor = sampleDispersedSource(vUv, refractOffset, chroma);
    float edgeMask = smoothstep(max(fieldStart + fieldSoftness * 0.65, 0.52), 1.2, edgeTravel) * masterFade;
    float rimLight = pow(max(dot(opticalNormal, -lightDirection), 0.0), 2.8) * edgeMask;
    float lowerLip = smoothstep(0.58, 1.0, vUv.y) * edgeMask;
    float sweep = smoothstep(0.025, 0.0, abs(vUv.x - fract(uTime * 0.05 + vUv.y * 0.26))) * edgeMask;
    float highlight = (rimLight * 0.72 + lowerLip * 0.24 + sweep * 0.12) * uHighlightStrength;
    vec3 highlightColor = vec3(0.78, 1.0, 0.84) * rimLight + vec3(0.55, 0.25, 1.0) * lowerLip;
    float absorption = edgeMask * clamp(uEdgeDarkening, 0.0, 1.0) * (0.28 + masterFade * 0.42);

    opticalColor = mix(opticalColor, opticalColor * (1.0 - absorption), edgeMask);
    opticalColor += highlightColor * highlight;
    opticalColor += vec3(chroma * 0.62, chroma * 0.12, chroma * 1.0) * edgeMask * masterFade;

    writeOutputColor(mix(baseColor, opticalColor, masterFade));
    return;
  }

  if (d < -0.001) {
    writeOutputColor(sampleSource(vUv));
    return;
  }

  vec2 eps = vec2(0.0015, 0.0);
  float dX = shapeDistance(p + eps.xy, innerSize, radius) - shapeDistance(p - eps.xy, innerSize, radius);
  float dY = shapeDistance(p + eps.yx, innerSize, radius) - shapeDistance(p - eps.yx, innerSize, radius);
  vec2 grad = vec2(dX, dY);
  vec2 normal = length(grad) > 0.00001 ? normalize(grad) : vec2(0.0);

  float borderMask = smoothstep(-0.001, thickness * 0.15, d) *
    (1.0 - smoothstep(thickness * 0.62, thickness * 1.24, d));
  borderMask *= regionMask;
  float bevel = pow(1.0 - clamp(d / max(thickness, 0.001), 0.0, 1.0), 0.58);
  vec2 opticalNormal = applyFlowToNormal(normal, p, borderMask);
  float pull = signedOpticalPower(uIOR) * borderMask * (0.07 + thickness * 0.62);
  vec2 refractOffset = opticalNormal * pull / aspectCorrection;
  vec3 color = sampleDispersedSource(vUv, refractOffset, chroma);
  float rimLight = pow(max(dot(opticalNormal, -lightDirection), 0.0), 2.8) * borderMask;
  float lowerLip = smoothstep(0.56, 1.0, vUv.y) * borderMask;
  float sweep = smoothstep(0.025, 0.0, abs(vUv.x - fract(uTime * 0.055 + vUv.y * 0.28)));
  float highlight = (rimLight * 0.82 + lowerLip * 0.28 + sweep * 0.18) * uHighlightStrength;
  vec3 highlightColor = vec3(0.78, 1.0, 0.84) * rimLight + vec3(0.55, 0.25, 1.0) * lowerLip;

  float absorption = borderMask * bevel * clamp(uEdgeDarkening, 0.0, 1.0);
  color = mix(color, color * (1.0 - absorption), borderMask);
  color += highlightColor * highlight;
  color += vec3(chroma * 0.9, chroma * 0.18, chroma * 1.35) * borderMask * bevel;

  writeOutputColor(color);
}
`

export class WebGLVideoEdgeGlassRenderer {
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly canvas: HTMLCanvasElement
  private disposed = false
  private readonly fixedPixelRatio?: number
  private readonly geometry = new THREE.PlaneGeometry(2, 2)
  private readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh
  private readonly renderer: THREE.WebGLRenderer
  private readonly resizeObserver: ResizeObserver
  private readonly scene = new THREE.Scene()
  private settings: LiquidGlassSettings
  private readonly source: RenderSourceElement
  private sourceNaturalSize?: SourceSize
  private videoFrameHandle: number | null = null
  private readonly sourceTexture: THREE.Texture

  constructor({
    autoResize = true,
    canvas,
    fixedPixelRatio,
    preserveDrawingBuffer = false,
    settings,
    source,
    sourceNaturalSize,
  }: RendererOptions) {
    this.canvas = canvas
    this.fixedPixelRatio = fixedPixelRatio
    this.source = source
    this.sourceNaturalSize = sourceNaturalSize
    this.settings = settings
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      canvas,
      depth: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer,
      stencil: false,
    })
    this.renderer.setClearColor(0x020202, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.sourceTexture = this.createSourceTexture(source)

    this.material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader,
      uniforms: {
        uBorderThickness: { value: settings.edgeThickness },
        uCornerRadius: { value: settings.cornerRadius },
        uDispersion: { value: settings.dispersion },
        uEdgeDarkening: { value: settings.edgeDarkening },
        uExposure: { value: settings.exposure },
        uBrightness: { value: settings.brightness },
        uContrast: { value: settings.contrast },
        uSaturation: { value: settings.saturation },
        uTemperature: { value: settings.temperature },
        uTint: { value: settings.tint },
        uGamma: { value: settings.gamma },
        uFieldCurve: { value: settings.fieldCurve },
        uFieldEnabled: { value: settings.fieldEnabled ? 1 : 0 },
        uFieldFadeMode: { value: settings.fieldFadeMode },
        uFieldSoftness: { value: settings.fieldSoftness },
        uFieldStart: { value: settings.fieldStart },
        uFieldStrength: { value: settings.fieldStrength },
        uFlowBoundaryDamping: { value: settings.flowBoundaryDamping },
        uFlowEnabled: { value: settings.flowEnabled ? 1 : 0 },
        uFlowLayerMix: { value: settings.flowLayerMix },
        uFlowMode: { value: settings.flowMode },
        uFlowScale: { value: settings.flowScale },
        uFlowSpeed: { value: settings.flowSpeed },
        uFlowStrength: { value: settings.flowStrength },
        uFlowTurbulence: { value: settings.flowTurbulence },
        uHighlightStrength: { value: settings.highlightStrength },
        uIOR: { value: settings.ior },
        uRegionEdges: {
          value: new THREE.Vector4(
            settings.regionTop ? 1 : 0,
            settings.regionRight ? 1 : 0,
            settings.regionBottom ? 1 : 0,
            settings.regionLeft ? 1 : 0,
          ),
        },
        uRegionSoftness: { value: settings.regionSoftness },
        uRegionWidth: { value: settings.regionWidth },
        uShapeType: { value: settings.shapeType },
        uShapeWarp: { value: settings.shapeWarp },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSourceAspect: { value: 16 / 9 },
        uSourceTexture: { value: this.sourceTexture },
      },
      vertexShader,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    this.resizeObserver = new ResizeObserver(() => this.resize())

    if (autoResize) {
      this.resizeObserver.observe(canvas)
    }

    this.updateSettings(settings)
  }

  private createSourceTexture(source: RenderSourceElement) {
    const texture = this.isVideoSource(source) ? new THREE.VideoTexture(source) : new THREE.Texture(source)

    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.needsUpdate = true

    return texture
  }

  dispose() {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    const source = this.source as VideoSourceElement

    if (this.videoFrameHandle !== null && this.isVideoSource(this.source) && source.cancelVideoFrameCallback) {
      source.cancelVideoFrameCallback(this.videoFrameHandle)
    }

    this.sourceTexture.dispose()
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }

  start() {
    this.resize()

    if (this.isVideoSource(this.source)) {
      this.startVideoFrameLoop()
    }

    this.renderer.setAnimationLoop((time) => this.render(time))
  }

  renderFrame(timeSeconds: number) {
    if (this.isVideoSource(this.source)) {
      this.sourceTexture.needsUpdate = true
    }

    this.render(timeSeconds * 1000)
  }

  resizeTo(size: SourceSize) {
    const width = Math.max(1, Math.round(size.width))
    const height = Math.max(1, Math.round(size.height))

    this.renderer.setPixelRatio(1)
    this.renderer.setSize(width, height, false)
    this.material.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height)
    this.material.uniforms.uSourceAspect.value = this.getSourceAspect()
  }

  updateSourceNaturalSize(sourceNaturalSize: SourceSize) {
    this.sourceNaturalSize = sourceNaturalSize
    this.sourceTexture.needsUpdate = true
    this.resize()
  }

  updateSettings(settings: LiquidGlassSettings) {
    this.settings = settings
    this.material.uniforms.uIOR.value = settings.ior
    this.material.uniforms.uBorderThickness.value = settings.edgeThickness
    this.material.uniforms.uCornerRadius.value = settings.cornerRadius
    this.material.uniforms.uDispersion.value = settings.dispersion
    this.material.uniforms.uEdgeDarkening.value = settings.edgeDarkening
    this.material.uniforms.uExposure.value = settings.exposure
    this.material.uniforms.uBrightness.value = settings.brightness
    this.material.uniforms.uContrast.value = settings.contrast
    this.material.uniforms.uSaturation.value = settings.saturation
    this.material.uniforms.uTemperature.value = settings.temperature
    this.material.uniforms.uTint.value = settings.tint
    this.material.uniforms.uGamma.value = settings.gamma
    this.material.uniforms.uFieldCurve.value = settings.fieldCurve
    this.material.uniforms.uFieldEnabled.value = settings.fieldEnabled ? 1 : 0
    this.material.uniforms.uFieldFadeMode.value = settings.fieldFadeMode
    this.material.uniforms.uFieldSoftness.value = settings.fieldSoftness
    this.material.uniforms.uFieldStart.value = settings.fieldStart
    this.material.uniforms.uFieldStrength.value = settings.fieldStrength
    this.material.uniforms.uFlowBoundaryDamping.value = settings.flowBoundaryDamping
    this.material.uniforms.uFlowEnabled.value = settings.flowEnabled ? 1 : 0
    this.material.uniforms.uFlowLayerMix.value = settings.flowLayerMix
    this.material.uniforms.uFlowMode.value = settings.flowMode
    this.material.uniforms.uFlowScale.value = settings.flowScale
    this.material.uniforms.uFlowSpeed.value = settings.flowSpeed
    this.material.uniforms.uFlowStrength.value = settings.flowStrength
    this.material.uniforms.uFlowTurbulence.value = settings.flowTurbulence
    this.material.uniforms.uHighlightStrength.value = settings.highlightStrength
    this.material.uniforms.uRegionEdges.value.set(
      settings.regionTop ? 1 : 0,
      settings.regionRight ? 1 : 0,
      settings.regionBottom ? 1 : 0,
      settings.regionLeft ? 1 : 0,
    )
    this.material.uniforms.uRegionSoftness.value = settings.regionSoftness
    this.material.uniforms.uRegionWidth.value = settings.regionWidth
    this.material.uniforms.uShapeType.value = settings.shapeType
    this.material.uniforms.uShapeWarp.value = settings.shapeWarp
    this.resize()
  }

  private render(time: number) {
    if (this.disposed) {
      return
    }

    if (this.isVideoSource(this.source) && !(this.source as VideoSourceElement).requestVideoFrameCallback) {
      this.sourceTexture.needsUpdate = true
    }

    this.material.uniforms.uTime.value = time / 1000
    this.renderer.render(this.scene, this.camera)
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    const pixelRatio = this.fixedPixelRatio ?? Math.min(Math.max(this.settings.pixelRatio, 1), 3)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.material.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height)
    this.material.uniforms.uSourceAspect.value = this.getSourceAspect()
  }

  private startVideoFrameLoop() {
    if (!this.isVideoSource(this.source)) {
      return
    }

    const source = this.source as VideoSourceElement

    if (!source.requestVideoFrameCallback) {
      return
    }

    const updateTexture = () => {
      this.sourceTexture.needsUpdate = true

      if (!this.disposed && source.requestVideoFrameCallback) {
        this.videoFrameHandle = source.requestVideoFrameCallback(updateTexture)
      }
    }

    this.videoFrameHandle = source.requestVideoFrameCallback(updateTexture)
  }

  private getSourceAspect() {
    if (
      this.sourceNaturalSize &&
      this.sourceNaturalSize.width > 0 &&
      this.sourceNaturalSize.height > 0
    ) {
      return this.sourceNaturalSize.width / this.sourceNaturalSize.height
    }

    if (this.isVideoSource(this.source) && this.source.videoWidth > 0 && this.source.videoHeight > 0) {
      return this.source.videoWidth / this.source.videoHeight
    }

    if (!this.isVideoSource(this.source) && this.source.naturalWidth > 0 && this.source.naturalHeight > 0) {
      return this.source.naturalWidth / this.source.naturalHeight
    }

    return 16 / 9
  }

  private isVideoSource(source: RenderSourceElement): source is HTMLVideoElement {
    return source.tagName.toLowerCase() === 'video'
  }
}
