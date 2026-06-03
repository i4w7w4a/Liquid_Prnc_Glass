import * as THREE from 'three'
import type { LiquidGlassSettings } from './settings'

type VideoFrameSource = HTMLVideoElement & {
  cancelVideoFrameCallback?: (handle: number) => void
  requestVideoFrameCallback?: (callback: () => void) => number
}

type RendererOptions = {
  canvas: HTMLCanvasElement
  settings: LiquidGlassSettings
  video: HTMLVideoElement
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

uniform sampler2D uVideoTexture;
uniform vec2 uResolution;
uniform float uVideoAspect;
uniform float uTime;
uniform float uIOR;
uniform float uBorderThickness;
uniform float uCornerRadius;
uniform float uDispersion;
uniform float uEdgeDarkening;
uniform float uHighlightStrength;

varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec2 coverUv(vec2 uv) {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float videoAspect = max(uVideoAspect, 0.01);
  vec2 scale = vec2(1.0);

  if (canvasAspect > videoAspect) {
    scale.y = videoAspect / canvasAspect;
  } else {
    scale.x = canvasAspect / videoAspect;
  }

  return (uv - 0.5) * scale + 0.5;
}

vec3 sampleVideo(vec2 uv) {
  return texture2D(uVideoTexture, clamp(coverUv(uv), vec2(0.001), vec2(0.999))).rgb;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 aspectCorrection = vec2(aspect, 1.0);
  vec2 p = (vUv - 0.5) * aspectCorrection;
  float thickness = clamp(uBorderThickness, 0.001, 0.32);
  float radius = clamp(uCornerRadius, 0.0, 0.34);
  vec2 innerSize = vec2(max(0.001, 0.5 * aspect - thickness * aspect), max(0.001, 0.5 - thickness));
  float d = sdRoundedBox(p, innerSize, radius);

  if (d < -0.001) {
    gl_FragColor = vec4(sampleVideo(vUv), 1.0);
    return;
  }

  vec2 eps = vec2(0.0015, 0.0);
  float dX = sdRoundedBox(p + eps.xy, innerSize, radius) - sdRoundedBox(p - eps.xy, innerSize, radius);
  float dY = sdRoundedBox(p + eps.yx, innerSize, radius) - sdRoundedBox(p - eps.yx, innerSize, radius);
  vec2 grad = vec2(dX, dY);
  vec2 normal = length(grad) > 0.00001 ? normalize(grad) : vec2(0.0);

  float borderMask = smoothstep(-0.001, thickness * 0.15, d) *
    (1.0 - smoothstep(thickness * 0.62, thickness * 1.24, d));
  float bevel = pow(1.0 - clamp(d / max(thickness, 0.001), 0.0, 1.0), 0.58);
  float pull = (uIOR - 1.0) * borderMask * (0.07 + thickness * 0.62);
  vec2 refractOffset = normal * pull / aspectCorrection;

  float chroma = clamp(uDispersion, 0.0, 0.12);
  vec3 color;
  color.r = sampleVideo(vUv + refractOffset * (1.0 + chroma * 3.5)).r;
  color.g = sampleVideo(vUv + refractOffset).g;
  color.b = sampleVideo(vUv + refractOffset * (1.0 - chroma * 3.5)).b;

  vec2 lightDirection = normalize(vec2(-0.46, -0.89));
  float rimLight = pow(max(dot(normal, -lightDirection), 0.0), 2.8) * borderMask;
  float lowerLip = smoothstep(0.56, 1.0, vUv.y) * borderMask;
  float sweep = smoothstep(0.025, 0.0, abs(vUv.x - fract(uTime * 0.055 + vUv.y * 0.28)));
  float highlight = (rimLight * 0.82 + lowerLip * 0.28 + sweep * 0.18) * uHighlightStrength;
  vec3 highlightColor = vec3(0.78, 1.0, 0.84) * rimLight + vec3(0.55, 0.25, 1.0) * lowerLip;

  float absorption = borderMask * bevel * clamp(uEdgeDarkening, 0.0, 1.0);
  color = mix(color, color * (1.0 - absorption), borderMask);
  color += highlightColor * highlight;
  color += vec3(chroma * 0.9, chroma * 0.18, chroma * 1.35) * borderMask * bevel;

  gl_FragColor = vec4(color, 1.0);
}
`

export class WebGLVideoEdgeGlassRenderer {
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly canvas: HTMLCanvasElement
  private disposed = false
  private readonly geometry = new THREE.PlaneGeometry(2, 2)
  private readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh
  private readonly renderer: THREE.WebGLRenderer
  private readonly resizeObserver: ResizeObserver
  private readonly scene = new THREE.Scene()
  private settings: LiquidGlassSettings
  private readonly video: HTMLVideoElement
  private videoFrameHandle: number | null = null
  private readonly videoTexture: THREE.VideoTexture

  constructor({ canvas, settings, video }: RendererOptions) {
    this.canvas = canvas
    this.video = video
    this.settings = settings
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      canvas,
      depth: false,
      powerPreference: 'high-performance',
      stencil: false,
    })
    this.renderer.setClearColor(0x020202, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.videoTexture = new THREE.VideoTexture(video)
    this.videoTexture.colorSpace = THREE.SRGBColorSpace
    this.videoTexture.generateMipmaps = false
    this.videoTexture.magFilter = THREE.LinearFilter
    this.videoTexture.minFilter = THREE.LinearFilter

    this.material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader,
      uniforms: {
        uBorderThickness: { value: settings.edgeThickness },
        uCornerRadius: { value: settings.cornerRadius },
        uDispersion: { value: settings.dispersion },
        uEdgeDarkening: { value: settings.edgeDarkening },
        uHighlightStrength: { value: settings.highlightStrength },
        uIOR: { value: settings.ior },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uVideoAspect: { value: 16 / 9 },
        uVideoTexture: { value: this.videoTexture },
      },
      vertexShader,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.updateSettings(settings)
  }

  dispose() {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    const source = this.video as VideoFrameSource

    if (this.videoFrameHandle !== null && source.cancelVideoFrameCallback) {
      source.cancelVideoFrameCallback(this.videoFrameHandle)
    }

    this.videoTexture.dispose()
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }

  start() {
    this.resize()
    void this.video.play().catch(() => undefined)
    this.startVideoFrameLoop()
    this.renderer.setAnimationLoop((time) => this.render(time))
  }

  updateSettings(settings: LiquidGlassSettings) {
    this.settings = settings
    this.material.uniforms.uIOR.value = settings.ior
    this.material.uniforms.uBorderThickness.value = settings.edgeThickness
    this.material.uniforms.uCornerRadius.value = settings.cornerRadius
    this.material.uniforms.uDispersion.value = settings.dispersion
    this.material.uniforms.uEdgeDarkening.value = settings.edgeDarkening
    this.material.uniforms.uHighlightStrength.value = settings.highlightStrength
    this.resize()
  }

  private render(time: number) {
    if (this.disposed) {
      return
    }

    if (!(this.video as VideoFrameSource).requestVideoFrameCallback) {
      this.videoTexture.needsUpdate = true
    }

    this.material.uniforms.uTime.value = time / 1000
    this.renderer.render(this.scene, this.camera)
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    const pixelRatio = Math.min(Math.max(this.settings.pixelRatio, 1), 3)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.material.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height)
    const videoAspect =
      this.video.videoWidth > 0 && this.video.videoHeight > 0
        ? this.video.videoWidth / this.video.videoHeight
        : 16 / 9
    this.material.uniforms.uVideoAspect.value = videoAspect
  }

  private startVideoFrameLoop() {
    const source = this.video as VideoFrameSource

    if (!source.requestVideoFrameCallback) {
      return
    }

    const updateTexture = () => {
      this.videoTexture.needsUpdate = true

      if (!this.disposed && source.requestVideoFrameCallback) {
        this.videoFrameHandle = source.requestVideoFrameCallback(updateTexture)
      }
    }

    this.videoFrameHandle = source.requestVideoFrameCallback(updateTexture)
  }
}
