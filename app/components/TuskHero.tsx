'use client'

import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 3000
const BG_COLOR = '#020008'

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function getTextPoints(text: string, count: number, width: number, height: number): Float32Array {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 100px "Arial Black", "Impact", sans-serif'
  ctx.fillText(text, width / 2, height / 2)
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data
  const filled: [number, number][] = []
  for (let y = 0; y < height; y += 2)
    for (let x = 0; x < width; x += 2)
      if (pixels[(y * width + x) * 4 + 3] > 128) filled.push([x, y])
  const positions = new Float32Array(count * 3)
  const sx = 4.5 / width, sy = 1.8 / height
  for (let i = 0; i < count; i++) {
    const p = filled[Math.floor(Math.random() * filled.length)]
    positions[i * 3] = (p[0] - width / 2) * sx
    positions[i * 3 + 1] = -(p[1] - height / 2) * sy
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.03
  }
  return positions
}

const scrollProgress = { value: 0 }

function gauss() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// Active Theory style color palette — rich RGB shades
const AT_COLORS = [
  [0.95, 0.35, 0.55],  // hot pink
  [0.85, 0.25, 0.65],  // magenta
  [0.30, 0.85, 0.75],  // teal
  [0.20, 0.70, 0.90],  // cyan
  [0.95, 0.75, 0.20],  // gold
  [0.90, 0.55, 0.15],  // amber
  [0.40, 0.90, 0.40],  // green
  [0.65, 0.35, 0.95],  // purple
  [0.95, 0.50, 0.30],  // orange
  [0.35, 0.55, 0.95],  // blue
]

function createBubbleTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  // Sphere-like bubble: bright highlight off-center, soft edge glow
  const grad = ctx.createRadialGradient(c * 0.7, c * 0.65, 0, c, c, c)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.1, 'rgba(255,255,255,0.7)')
  grad.addColorStop(0.3, 'rgba(255,255,255,0.35)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.12)')
  grad.addColorStop(0.8, 'rgba(255,255,255,0.04)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const fadeStart = useRef(-1)

  const bubbleTex = useMemo(() => {
    if (typeof document === 'undefined') return null
    return createBubbleTexture()
  }, [])

  const textTargets = useMemo(() => {
    if (typeof document === 'undefined') return new Float32Array(PARTICLE_COUNT * 3)
    return getTextPoints('TUSK AI', PARTICLE_COUNT, 1024, 256)
  }, [])

  const data = useMemo(() => {
    const startPos = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const reveal = new Float32Array(PARTICLE_COUNT)
    const orbitAngle = new Float32Array(PARTICLE_COUNT)
    const orbitRadius = new Float32Array(PARTICLE_COUNT)
    const orbitSpeed = new Float32Array(PARTICLE_COUNT)
    const orbitY = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Start: Gaussian cluster in center
      startPos[i * 3] = gauss() * 0.6
      startPos[i * 3 + 1] = gauss() * 0.8 - 0.3
      startPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4

      // Orbit params: each particle spirals out to a unique radius/angle
      orbitAngle[i] = Math.random() * Math.PI * 2
      orbitRadius[i] = 0.8 + Math.random() * 2.0
      orbitSpeed[i] = 0.5 + Math.random() * 0.7
      orbitY[i] = (Math.random() - 0.5) * 1.6

      reveal[i] = Math.random()

      const sizeRand = Math.random()
      if (sizeRand < 0.5) sizes[i] = 0.06 + Math.random() * 0.06
      else if (sizeRand < 0.85) sizes[i] = 0.12 + Math.random() * 0.1
      else sizes[i] = 0.22 + Math.random() * 0.15

      const baseColor = AT_COLORS[Math.floor(Math.random() * AT_COLORS.length)]
      const variation = 0.85 + Math.random() * 0.3
      colors[i * 3] = Math.min(1, baseColor[0] * variation)
      colors[i * 3 + 1] = Math.min(1, baseColor[1] * variation)
      colors[i * 3 + 2] = Math.min(1, baseColor[2] * variation)
    }
    return { startPos, colors, sizes, reveal, orbitAngle, orbitRadius, orbitSpeed, orbitY }
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.startPos), 3))
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3))
    g.setAttribute('size', new THREE.BufferAttribute(data.sizes, 1))
    return g
  }, [data])

  // Custom shader for per-particle sizes
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: bubbleTex },
        uOpacity: { value: 0.35 },
        uScale: { value: 1.0 },
        uTextMix: { value: 0.0 },
      },
      vertexShader: `
        uniform float uScale;
        uniform float uTextMix;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        void main() {
          // Blend color toward bright white when forming text
          vec3 textColor = vec3(0.85, 0.82, 1.0);
          vColor = mix(color, textColor, uTextMix);
          vSize = size;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          // Shrink particles when forming text so letters are crisp
          float textShrink = mix(1.0, 0.45, uTextMix);
          gl_PointSize = size * uScale * textShrink * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uOpacity;
        uniform float uTextMix;
        varying vec3 vColor;
        varying float vSize;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          float alpha = tex.a * uOpacity;
          float sizeAlpha = mix(1.0, 0.4, smoothstep(0.05, 0.2, vSize));
          // When forming text, make particles more solid (less glass, more opaque core)
          float textBoost = mix(sizeAlpha, 1.0, uTextMix * 0.7);
          gl_FragColor = vec4(vColor * tex.rgb, alpha * textBoost);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [bubbleTex])

  useFrame(({ clock }) => {
    const pts = pointsRef.current
    if (!pts) return
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    if (!posAttr) return
    const now = clock.getElapsedTime()
    const arr = posAttr.array as Float32Array

    if (fadeStart.current < 0) fadeStart.current = now
    const fadeT = Math.min((now - fadeStart.current) / 2.0, 1)

    const scroll = scrollProgress.value
    const visibleThreshold = Math.min(0.3 + scroll * 1.75, 1.0)

    // Phase 1: scroll 0→0.45 = particles spiral outward in circular orbit
    // Phase 2: scroll 0.45→1.0 = orbiting particles converge to TUSK AI
    const orbitE = easeInOutCubic(Math.min(scroll / 0.45, 1))
    const textE = easeInOutCubic(Math.max(0, (scroll - 0.45) / 0.55))

    const { startPos, reveal, orbitAngle, orbitRadius, orbitSpeed, orbitY } = data

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      if (reveal[i] > visibleThreshold) {
        arr[i3] = 0; arr[i3 + 1] = 100; arr[i3 + 2] = 0
        continue
      }

      // Circular orbit position — spins around center, radius grows with scroll
      const angle = orbitAngle[i] + now * orbitSpeed[i]
      const r = orbitRadius[i] * orbitE
      const ox = Math.cos(angle) * r
      const oy = orbitY[i] * orbitE
      const oz = Math.sin(angle) * r * 0.4

      // Lerp: start → orbit
      const cx = startPos[i3] + (ox - startPos[i3]) * orbitE
      const cy = startPos[i3 + 1] + (oy - startPos[i3 + 1]) * orbitE
      const cz = startPos[i3 + 2] + (oz - startPos[i3 + 2]) * orbitE

      // Lerp: orbit → text
      const tx = textTargets[i3], ty = textTargets[i3 + 1], tz = textTargets[i3 + 2]
      const fx = cx + (tx - cx) * textE
      const fy = cy + (ty - cy) * textE
      const fz = cz + (tz - cz) * textE

      const d = (1 - textE) * 0.03
      arr[i3] = fx + Math.sin(now * 0.9 + i * 0.3) * d
      arr[i3 + 1] = fy + Math.cos(now * 0.7 + i * 0.4) * d
      arr[i3 + 2] = fz
    }
    posAttr.needsUpdate = true

    shaderMat.uniforms.uOpacity.value = fadeT * (0.45 + orbitE * 0.4)
    shaderMat.uniforms.uScale.value = 1.2 + orbitE * 0.3
    shaderMat.uniforms.uTextMix.value = textE
  })

  return (
    <points ref={pointsRef} geometry={geo} material={shaderMat} />
  )
}


function WaveButton() {
  const [active, setActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/BXRDVJA - Ghost Cities (1).mp3.mpeg')
      audioRef.current.loop = true
      audioRef.current.volume = 0.5
    }
    if (active) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setActive(!active)
  }, [active])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const now = Date.now() * 0.005
    const bars = 5
    const barW = 2
    const gap = 2
    const totalW = bars * barW + (bars - 1) * gap
    const startX = (w - totalW) / 2
    const cy = h / 2
    const maxH = h * 0.7

    for (let b = 0; b < bars; b++) {
      const phase = b * 1.2 + now
      const barH = active
        ? maxH * (0.3 + 0.35 * Math.sin(phase) + 0.2 * Math.sin(phase * 1.6 + b * 0.5))
        : 3
      const x = startX + b * (barW + gap)
      ctx.beginPath()
      ctx.roundRect(x, cy - barH / 2, barW, Math.max(barH, 2), 1)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.fill()
    }

    animRef.current = requestAnimationFrame(draw)
  }, [active])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-24 z-[9999] w-16 h-16 flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:opacity-100"
      style={{ background: 'none', border: 'none', padding: 0, opacity: 0.85 }}
      title="Toggle Music"
    >
      <canvas ref={canvasRef} width={38} height={38} className="pointer-events-none" />
    </button>
  )
}

export default function TuskHero() {
  const [ready, setReady] = useState(false)
  const [textVisible, setTextVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollableDistance = el.offsetHeight - window.innerHeight
      if (scrollableDistance <= 0) return
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(1, scrolled / scrollableDistance)
      scrollProgress.value = progress
      setTextVisible(progress >= 0.85)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <section ref={sectionRef} id="hero" className="relative w-full" style={{ height: '350vh', background: BG_COLOR }}>
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 52 }}
            gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
            className="absolute! inset-0"
          >
            <color attach="background" args={[BG_COLOR]} />
            <Particles />
          </Canvas>


          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none" style={{
            opacity: ready && !textVisible ? 1 : 0,
            transition: 'opacity 0.6s',
          }}>
            <span className="font-mono text-[8px] tracking-[5px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll to reveal</span>
            <div className="w-px h-8 animate-pulse" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
          </div>

          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            <nav className="flex items-center justify-between px-8 py-5 pointer-events-auto z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-mono text-[10px] tracking-[5px] font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tusk AI
                </span>
              </div>
              <div className="hidden md:flex gap-8">
                {['Platform', 'Solutions', 'Pricing', 'About'].map(item => (
                  <span key={item} className="font-mono text-[9px] tracking-[3px] uppercase cursor-pointer transition-colors duration-200 hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>{item}</span>
                ))}
              </div>
              <a href="#architecture" className="px-5 py-2 border rounded-md text-[9px] tracking-[3px] uppercase font-mono cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white pointer-events-auto"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }}>
                Get Started
              </a>
            </nav>

            <div className="flex flex-col items-center pb-20 z-10 px-6" style={{
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight mb-5 max-w-3xl"
                style={{ color: 'rgba(255,255,255,0.9)' }}>
                Stop managing workflows.{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Let AI orchestrate them.
                </span>
              </h1>
              <p className="text-sm md:text-base leading-7 max-w-xl text-center mb-10"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                Tusk AI replaces repetitive operational work with intelligent automation pipelines
                that learn, adapt, and execute — so you can focus on what matters.
              </p>
              <a href="#architecture" className="pointer-events-auto px-8 py-3.5 rounded-md text-[10px] tracking-[4px] uppercase font-mono cursor-pointer transition-all duration-300 hover:bg-white/20"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                }}>
                Initiate a Workflow Audit
              </a>
            </div>
          </div>
        </div>

      </section>
      <WaveButton />
    </>
  )
}
