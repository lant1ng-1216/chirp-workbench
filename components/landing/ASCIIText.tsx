'use client'
/**
 * React port of Vue Bits ASCIIText
 * Source: https://codepen.io/JuanFuentes/pen/eYEeoyE / Vue Bits
 */
import { useEffect, useRef, type CSSProperties } from 'react'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.;
    float waveFactor = uEnableWaves;
    vec3 transformed = position;
    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;
    float r = texture2D(uTexture, pos + cos(time * 2. - time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + tan(time * .5 + pos.x - time) * .01).g;
    float b = texture2D(uTexture, pos - cos(time * 2. + time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`

const PX_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1

function mapRange(n: number, start: number, stop: number, start2: number, stop2: number) {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2
}

interface AsciiFilterOptions {
  fontSize?: number
  fontFamily?: string
  charset?: string
  invert?: boolean
}

class AsciiFilter {
  renderer: THREE.WebGLRenderer
  domElement: HTMLDivElement
  pre: HTMLPreElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | null
  deg = 0
  invert: boolean
  fontSize: number
  fontFamily: string
  charset: string
  width = 0
  height = 0
  center = { x: 0, y: 0 }
  mouse = { x: 0, y: 0 }
  cols = 0
  rows = 0

  constructor(renderer: THREE.WebGLRenderer, { fontSize, fontFamily, charset, invert }: AsciiFilterOptions = {}) {
    this.renderer = renderer
    this.domElement = document.createElement('div')
    this.domElement.style.position = 'absolute'
    this.domElement.style.top = '0'
    this.domElement.style.left = '0'
    this.domElement.style.width = '100%'
    this.domElement.style.height = '100%'

    this.pre = document.createElement('pre')
    this.pre.style.margin = '0'
    this.pre.style.userSelect = 'none'
    this.pre.style.padding = '0'
    this.pre.style.lineHeight = '1em'
    this.pre.style.textAlign = 'left'
    this.pre.style.position = 'absolute'
    this.pre.style.left = '0'
    this.pre.style.top = '0'
    // Exact Vue Bits / CodePen styling — fixed radial + difference blend with the canvas underlay
    this.pre.style.backgroundImage = 'radial-gradient(circle, #ff6188 0%, #fc9867 50%, #ffd866 100%)'
    this.pre.style.backgroundAttachment = 'fixed'
    ;(this.pre.style as CSSStyleDeclaration & { webkitTextFillColor?: string }).webkitTextFillColor = 'transparent'
    ;(this.pre.style as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip = 'text'
    this.pre.style.backgroundClip = 'text'
    this.pre.style.zIndex = '9'
    this.pre.style.mixBlendMode = 'difference'
    this.domElement.appendChild(this.pre)

    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.left = '0'
    this.canvas.style.top = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.imageRendering = 'pixelated'
    // Must stay visible: pre uses mix-blend-mode:difference against this underlay
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })
    this.domElement.appendChild(this.canvas)

    this.deg = 0
    this.invert = invert ?? true
    this.fontSize = fontSize ?? 12
    this.fontFamily = fontFamily ?? "'Courier New', monospace"
    this.charset = charset ?? ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

    if (this.context) this.context.imageSmoothingEnabled = false
    this.onMouseMove = this.onMouseMove.bind(this)
    document.addEventListener('mousemove', this.onMouseMove)
  }

  setSize(width: number, height: number) {
    this.width = width
    this.height = height
    this.renderer.setSize(width, height)
    this.reset()
    this.center = { x: width / 2, y: height / 2 }
    this.mouse = { x: this.center.x, y: this.center.y }
  }

  reset() {
    if (!this.context) return
    this.context.font = `${this.fontSize}px ${this.fontFamily}`
    const charWidth = this.context.measureText('A').width
    this.cols = Math.floor(this.width / (this.fontSize * (charWidth / this.fontSize)))
    this.rows = Math.floor(this.height / this.fontSize)
    this.canvas.width = this.cols
    this.canvas.height = this.rows
    this.pre.style.fontFamily = this.fontFamily
    this.pre.style.fontSize = `${this.fontSize}px`
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera)
    const w = this.canvas.width
    const h = this.canvas.height
    if (!this.context || !w || !h) return
    this.context.clearRect(0, 0, w, h)
    this.context.drawImage(this.renderer.domElement, 0, 0, w, h)
    this.asciify(this.context, w, h)
    this.hue()
  }

  onMouseMove(e: MouseEvent) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO }
  }

  get dx() { return this.mouse.x - this.center.x }
  get dy() { return this.mouse.y - this.center.y }

  hue() {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI
    this.deg += (deg - this.deg) * 0.075
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!w || !h) return
    const imgData = ctx.getImageData(0, 0, w, h).data
    let str = ''
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = x * 4 + y * 4 * w
        const r = imgData[i]
        const g = imgData[i + 1]
        const b = imgData[i + 2]
        const a = imgData[i + 3]
        if (a === 0) {
          str += ' '
          continue
        }
        const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255
        let idx = Math.floor((1 - gray) * (this.charset.length - 1))
        if (this.invert) idx = this.charset.length - idx - 1
        str += this.charset[idx]
      }
      str += '\n'
    }
    this.pre.innerHTML = str
  }

  dispose() {
    document.removeEventListener('mousemove', this.onMouseMove)
  }
}

class CanvasTxt {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | null
  txt: string
  fontSize: number
  fontFamily: string
  color: string
  font: string

  constructor(txt: string, { fontSize = 200, fontFamily = 'Arial', color = '#fdf9f3' }: { fontSize?: number; fontFamily?: string; color?: string } = {}) {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')
    this.txt = txt
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.color = color
    this.font = `600 ${this.fontSize}px ${this.fontFamily}`
  }

  resize() {
    if (!this.context) return
    this.context.font = this.font
    const metrics = this.context.measureText(this.txt)
    // Extra pad so the final glyph (e.g. "p") is never clipped when font metrics settle late
    const padX = 40
    const padY = 28
    const textWidth = Math.ceil(metrics.width) + padX * 2
    const ascent = metrics.actualBoundingBoxAscent || this.fontSize * 0.8
    const descent = metrics.actualBoundingBoxDescent || this.fontSize * 0.25
    this.canvas.width = Math.max(textWidth, 40)
    this.canvas.height = Math.max(Math.ceil(ascent + descent) + padY * 2, 40)
  }

  render() {
    if (!this.context) return
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.fillStyle = this.color
    this.context.font = this.font
    const metrics = this.context.measureText(this.txt)
    const padX = 40
    const padY = 28
    const yPos = padY + (metrics.actualBoundingBoxAscent || this.fontSize * 0.8)
    this.context.fillText(this.txt, padX, yPos)
  }

  get width() { return this.canvas.width }
  get height() { return this.canvas.height }
  get texture() { return this.canvas }
}

class CanvAscii {
  textString: string
  asciiFontSize: number
  textFontSize: number
  textColor: string
  planeBaseHeight: number
  container: HTMLElement
  width: number
  height: number
  enableWaves: boolean
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  mouse: { x: number; y: number }
  textCanvas!: CanvasTxt
  texture!: THREE.CanvasTexture
  geometry!: THREE.PlaneGeometry
  material!: THREE.ShaderMaterial
  mesh!: THREE.Mesh
  renderer!: THREE.WebGLRenderer
  filter!: AsciiFilter
  center = { x: 0, y: 0 }
  animationFrameId = 0
  paused = false
  measuredTextWidth = 0
  remeshTimers: ReturnType<typeof setTimeout>[] = []
  onFontsDone: (() => void) | null = null

  constructor(
    opts: {
      text: string
      asciiFontSize: number
      textFontSize: number
      textColor: string
      planeBaseHeight: number
      enableWaves: boolean
    },
    containerElem: HTMLElement,
    width: number,
    height: number,
  ) {
    this.textString = opts.text
    this.asciiFontSize = opts.asciiFontSize
    this.textFontSize = opts.textFontSize
    this.textColor = opts.textColor
    this.planeBaseHeight = opts.planeBaseHeight
    this.enableWaves = opts.enableWaves
    this.container = containerElem
    this.width = width
    this.height = height
    this.camera = new THREE.PerspectiveCamera(45, Math.max(this.width / this.height, 0.01), 1, 1000)
    this.camera.position.z = 30
    this.scene = new THREE.Scene()
    this.mouse = { x: this.width / 2, y: this.height / 2 }
    this.onMouseMove = this.onMouseMove.bind(this)
  }

  /** Wait until IBM Plex Mono is actually usable for canvas measureText (not just fonts.ready). */
  async waitForMonoFont(timeoutMs = 4000) {
    const face = `600 ${this.textFontSize}px "IBM Plex Mono"`
    const asciiFace = `500 ${this.asciiFontSize}px "IBM Plex Mono"`
    try {
      await document.fonts.load(face)
      await document.fonts.load(asciiFace)
    } catch { /* continue polling */ }
    const start = performance.now()
    while (performance.now() - start < timeoutMs) {
      if (document.fonts.check(face)) return true
      await new Promise(r => setTimeout(r, 50))
    }
    try { await document.fonts.ready } catch { /* ignore */ }
    return document.fonts.check(face)
  }

  async init() {
    await this.waitForMonoFont()
    this.setMesh()
    this.setRenderer()
    // Self-heal: font may finish swapping in after first paint — remesh if width jumps
    requestAnimationFrame(() => { this.remeshIfMetricsChanged() })
    this.remeshTimers.push(setTimeout(() => { this.remeshIfMetricsChanged() }, 200))
    this.remeshTimers.push(setTimeout(() => { this.remeshIfMetricsChanged() }, 800))
    this.onFontsDone = () => { this.remeshIfMetricsChanged() }
    document.fonts.addEventListener('loadingdone', this.onFontsDone)
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: '"IBM Plex Mono", monospace',
      color: this.textColor,
    })
    this.textCanvas.resize()
    this.textCanvas.render()
    this.measuredTextWidth = this.textCanvas.width

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture)
    this.texture.minFilter = THREE.NearestFilter

    const textAspect = this.textCanvas.width / this.textCanvas.height
    const baseH = this.planeBaseHeight
    const planeW = baseH * textAspect

    this.geometry = new THREE.PlaneGeometry(planeW, baseH, 36, 36)
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
      },
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  /** Rebuild text canvas + plane when font metrics finally settle (fixes clipped "p" on first load). */
  remeshIfMetricsChanged() {
    if (!this.textCanvas || !this.mesh) return
    const prev = this.measuredTextWidth
    this.textCanvas.resize()
    this.textCanvas.render()
    const next = this.textCanvas.width
    // Ignore tiny jitter; rebuild when width moved > 2% (typical fallback→Plex Mono jump)
    if (prev > 0 && Math.abs(next - prev) / prev < 0.02) {
      this.texture.needsUpdate = true
      return
    }
    this.measuredTextWidth = next
    this.texture.dispose()
    this.texture = new THREE.CanvasTexture(this.textCanvas.texture)
    this.texture.minFilter = THREE.NearestFilter

    const textAspect = this.textCanvas.width / this.textCanvas.height
    const baseH = this.planeBaseHeight
    const planeW = baseH * textAspect
    this.geometry.dispose()
    this.geometry = new THREE.PlaneGeometry(planeW, baseH, 36, 36)
    this.mesh.geometry = this.geometry
    ;(this.mesh.material as THREE.ShaderMaterial).uniforms.uTexture.value = this.texture
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setClearColor(0x000000, 0)

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: this.asciiFontSize,
      invert: true,
    })

    this.container.appendChild(this.filter.domElement)
    this.setSize(this.width, this.height)
    this.container.addEventListener('mousemove', this.onMouseMove)
    this.container.addEventListener('touchmove', this.onMouseMove as EventListener, { passive: true })
  }

  setSize(w: number, h: number) {
    this.width = w
    this.height = h
    this.camera.aspect = Math.max(w / h, 0.01)
    this.camera.updateProjectionMatrix()
    this.filter.setSize(w, h)
    this.center = { x: w / 2, y: h / 2 }
  }

  load() { this.animate() }

  onMouseMove(evt: MouseEvent | TouchEvent) {
    const e = 'touches' in evt ? evt.touches[0] : evt
    if (!e) return
    const bounds = this.container.getBoundingClientRect()
    this.mouse = { x: e.clientX - bounds.left, y: e.clientY - bounds.top }
  }

  animate() {
    const frame = () => {
      this.animationFrameId = requestAnimationFrame(frame)
      if (!this.paused) this.render()
    }
    frame()
  }

  render() {
    const time = Date.now() * 0.001
    this.textCanvas.render()
    this.texture.needsUpdate = true
    ;(this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = Math.sin(time)
    this.updateRotation()
    this.filter.render(this.scene, this.camera)
  }

  updateRotation() {
    const x = mapRange(this.mouse.y, 0, this.height, 0.5, -0.5)
    const y = mapRange(this.mouse.x, 0, this.width, -0.5, 0.5)
    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05
  }

  clear() {
    this.scene.traverse(object => {
      const obj = object as THREE.Mesh
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach(mat => {
        mat.dispose()
        Object.keys(mat).forEach(key => {
          const prop = (mat as unknown as Record<string, unknown>)[key]
          if (prop && typeof prop === 'object' && prop !== null && 'dispose' in prop && typeof (prop as { dispose: unknown }).dispose === 'function') {
            ;(prop as { dispose: () => void }).dispose()
          }
        })
      })
      obj.geometry?.dispose()
    })
    this.scene.clear()
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = 0
    for (const t of this.remeshTimers) clearTimeout(t)
    this.remeshTimers = []
    if (this.onFontsDone) {
      document.fonts.removeEventListener('loadingdone', this.onFontsDone)
      this.onFontsDone = null
    }
    if (this.filter) {
      this.filter.dispose()
      if (this.filter.domElement.parentNode) {
        this.container.removeChild(this.filter.domElement)
      }
    }
    this.container.removeEventListener('mousemove', this.onMouseMove)
    this.container.removeEventListener('touchmove', this.onMouseMove as EventListener)
    this.clear()
    // Do NOT call forceContextLoss — React Strict Mode remounts and needs a live GPU context
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
}

export type ASCIITextProps = {
  text?: string
  asciiFontSize?: number
  textFontSize?: number
  textColor?: string
  planeBaseHeight?: number
  enableWaves?: boolean
  className?: string
  style?: CSSProperties
}

function showFallback(container: HTMLDivElement, text: string) {
  container.replaceChildren()
  const el = document.createElement('div')
  el.textContent = text
  Object.assign(el.style, {
    fontFamily: '"IBM Plex Mono", monospace',
    fontWeight: '700',
    fontSize: 'clamp(48px, 8vw, 88px)',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: '-0.04em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  })
  container.appendChild(el)
}

export default function ASCIIText({
  text = 'Chirp',
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = '#fdf9f3',
  planeBaseHeight = 8,
  enableWaves = true,
  className,
  style,
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let ascii: CanvAscii | null = null
    let resizeObs: ResizeObserver | null = null
    let io: IntersectionObserver | null = null
    let bootGen = 0

    if (!document.querySelector('link[data-ascii-font]')) {
      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&display=swap'
      fontLink.setAttribute('data-ascii-font', '1')
      document.head.appendChild(fontLink)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showFallback(container, text)
      return
    }

    const boot = async (w: number, h: number) => {
      if (cancelled || w < 8 || h < 8) return
      const gen = ++bootGen
      // Clear any previous fallback / stale DOM before mounting WebGL overlay
      container.replaceChildren()
      try {
        const instance = new CanvAscii(
          { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
          container,
          w,
          h,
        )
        await instance.init()
        if (cancelled || gen !== bootGen) {
          instance.dispose()
          return
        }
        ascii = instance
        ascii.load()
        resizeObs?.disconnect()
        resizeObs = new ResizeObserver(entries => {
          const entry = entries[0]
          if (!entry || !ascii) return
          const { width: rw, height: rh } = entry.contentRect
          if (rw > 8 && rh > 8) {
            ascii.setSize(rw, rh)
            ascii.remeshIfMetricsChanged()
          }
        })
        resizeObs.observe(container)
      } catch (err) {
        if (!cancelled && gen === bootGen) {
          console.warn('[ASCIIText] init failed, using fallback', err)
          showFallback(container, text)
        }
      }
    }

    const tryStart = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width > 8 && height > 8) {
        void boot(width, height)
        return true
      }
      return false
    }

    if (!tryStart()) {
      io = new IntersectionObserver(([entry]) => {
        if (cancelled || !entry?.isIntersecting) return
        if (tryStart()) {
          io?.disconnect()
          io = null
        }
      }, { threshold: 0.01 })
      io.observe(container)
      requestAnimationFrame(() => { if (!cancelled) tryStart() })
      setTimeout(() => { if (!cancelled && !ascii) tryStart() }, 150)
    }

    const onVis = () => {
      if (ascii) ascii.paused = document.hidden
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      bootGen += 1
      document.removeEventListener('visibilitychange', onVis)
      io?.disconnect()
      resizeObs?.disconnect()
      ascii?.dispose()
      ascii = null
    }
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves])

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label={text}
      role="img"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: 120,
        minHeight: 120,
        ...style,
      }}
    />
  )
}
