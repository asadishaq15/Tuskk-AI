'use client'

import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 4000
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
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
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
const mouseWorld = { x: 0, y: 0 }

function gauss() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

const AT_COLORS: [number, number, number][] = [
  [1.0, 1.0, 1.0],     // white (primary)
  [1.0, 1.0, 1.0],     // white
  [1.0, 1.0, 1.0],     // white
  [1.0, 1.0, 1.0],     // white
  [0.95, 0.80, 0.30],  // gold
  [1.0, 0.85, 0.40],   // warm gold
  [0.90, 0.70, 0.20],  // deep gold
  [0.85, 0.75, 0.35],  // amber gold
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
    const baseColors = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const reveal = new Float32Array(PARTICLE_COUNT)
    const spreadPos = new Float32Array(PARTICLE_COUNT * 3)
    const blinkPhase = new Float32Array(PARTICLE_COUNT)
    const isGold = new Uint8Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      startPos[i * 3] = gauss() * 0.6
      startPos[i * 3 + 1] = gauss() * 0.8 - 0.3
      startPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4

      spreadPos[i * 3] = (Math.random() - 0.5) * 7.0
      spreadPos[i * 3 + 1] = (Math.random() - 0.5) * 4.6
      spreadPos[i * 3 + 2] = (Math.random() - 0.5) * 3.0

      reveal[i] = Math.random()
      blinkPhase[i] = Math.random() * Math.PI * 2

      const sizeRand = Math.random()
      if (sizeRand < 0.5) sizes[i] = 0.08 + Math.random() * 0.07
      else if (sizeRand < 0.85) sizes[i] = 0.15 + Math.random() * 0.1
      else sizes[i] = 0.25 + Math.random() * 0.12

      const baseColor = AT_COLORS[Math.floor(Math.random() * AT_COLORS.length)]
      isGold[i] = baseColor[0] > 0.88 && baseColor[1] < 0.9 && baseColor[2] < 0.5 ? 1 : 0
      const variation = 0.85 + Math.random() * 0.3
      baseColors[i * 3] = Math.min(1, baseColor[0] * variation)
      baseColors[i * 3 + 1] = Math.min(1, baseColor[1] * variation)
      baseColors[i * 3 + 2] = Math.min(1, baseColor[2] * variation)
      colors[i * 3] = baseColors[i * 3]
      colors[i * 3 + 1] = baseColors[i * 3 + 1]
      colors[i * 3 + 2] = baseColors[i * 3 + 2]
    }
    return { startPos, spreadPos, baseColors, colors, sizes, reveal, blinkPhase, isGold }
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
          vec3 textColor = vec3(1.0, 1.0, 1.0);
          vColor = mix(color, textColor, uTextMix);
          vSize = size;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float normalSize = size * uScale * (300.0 / -mvPos.z);
          float textSize = 0.04 * uScale * (300.0 / -mvPos.z);
          gl_PointSize = mix(normalSize, textSize, uTextMix);
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
          float dist = length(gl_PointCoord - vec2(0.5));
          float hardDot = smoothstep(0.5, 0.35, dist);
          float bubbleAlpha = tex.a * uOpacity;
          float sizeAlpha = mix(1.0, 0.4, smoothstep(0.05, 0.2, vSize));
          float normalAlpha = bubbleAlpha * sizeAlpha;
          float textAlpha = hardDot * 0.95;
          float finalAlpha = mix(normalAlpha, textAlpha, uTextMix);
          gl_FragColor = vec4(vColor, finalAlpha);
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
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute
    if (!posAttr || !colAttr) return
    const now = clock.getElapsedTime()
    const arr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    if (fadeStart.current < 0) fadeStart.current = now
    const fadeT = Math.min((now - fadeStart.current) / 2.0, 1)

    const scroll = scrollProgress.value
    const visibleThreshold = Math.min(0.3 + scroll * 1.75, 1.0)

    const spreadE = easeInOutCubic(Math.min(scroll / 0.45, 1))
    const textE = easeInOutCubic(Math.max(0, (scroll - 0.45) / 0.55))

    const { startPos, spreadPos, baseColors, reveal, blinkPhase, isGold } = data

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      if (reveal[i] > visibleThreshold) {
        arr[i3] = 0; arr[i3 + 1] = 100; arr[i3 + 2] = 0
        continue
      }

      const sx = spreadPos[i3]
      const sy = spreadPos[i3 + 1]
      const sz = spreadPos[i3 + 2]
      const cx = startPos[i3] + (sx - startPos[i3]) * spreadE
      const cy = startPos[i3 + 1] + (sy - startPos[i3 + 1]) * spreadE
      const cz = startPos[i3 + 2] + (sz - startPos[i3 + 2]) * spreadE

      const tx = textTargets[i3], ty = textTargets[i3 + 1], tz = textTargets[i3 + 2]
      const fx = cx + (tx - cx) * textE
      const fy = cy + (ty - cy) * textE
      const fz = cz + (tz - cz) * textE

      const d = 0.03 * (1 - textE)
      let px = fx + Math.sin(now * 0.9 + i * 0.3) * d
      let py = fy + Math.cos(now * 0.7 + i * 0.4) * d

      const mdx = px - mouseWorld.x
      const mdy = py - mouseWorld.y
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
      const repulseR = 0.8
      if (mDist < repulseR && mDist > 0.001) {
        const force = (1 - mDist / repulseR) * 0.06
        px += (mdx / mDist) * force
        py += (mdy / mDist) * force
      }

      arr[i3] = px
      arr[i3 + 1] = py
      arr[i3 + 2] = fz

      if (isGold[i]) {
        const blink = 0.5 + 0.5 * Math.sin(now * 2.5 + blinkPhase[i])
        colArr[i3] = baseColors[i3] * blink + (1.0 - blink) * 0.15
        colArr[i3 + 1] = baseColors[i3 + 1] * blink + (1.0 - blink) * 0.12
        colArr[i3 + 2] = baseColors[i3 + 2] * blink + (1.0 - blink) * 0.05
      }
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    shaderMat.uniforms.uOpacity.value = fadeT * 0.65
    shaderMat.uniforms.uScale.value = 1.3
    shaderMat.uniforms.uTextMix.value = textE
  })

  return (
    <points ref={pointsRef} geometry={geo} material={shaderMat} />
  )
}


function SineWave({ active }: { active: boolean }) {
  const flat = "M0 10 L32 10"
  const wave1a = "M0 10 Q4 2, 8 10 Q12 18, 16 10 Q20 2, 24 10 Q28 18, 32 10"
  const wave1b = "M0 10 Q4 18, 8 10 Q12 2, 16 10 Q20 18, 24 10 Q28 2, 32 10"
  const wave2a = "M0 10 Q4 4, 8 10 Q12 16, 16 10 Q20 4, 24 10 Q28 16, 32 10"
  const wave2b = "M0 10 Q4 16, 8 10 Q12 4, 16 10 Q20 16, 24 10 Q28 4, 32 10"

  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      <path
        d={active ? wave1a : flat}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        style={{ animation: active ? 'waveWhite 1.2s ease-in-out infinite alternate' : 'none', transition: 'd 0.4s ease' }}
      />
      <path
        d={active ? wave2a : flat}
        stroke="rgba(212,175,55,0.5)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        style={{ animation: active ? 'waveGold 1.4s ease-in-out infinite alternate' : 'none', transition: 'd 0.4s ease' }}
      />
      <style>{`
        @keyframes waveWhite {
          0% { d: path("${wave1a}"); }
          100% { d: path("${wave1b}"); }
        }
        @keyframes waveGold {
          0% { d: path("${wave2a}"); }
          100% { d: path("${wave2b}"); }
        }
      `}</style>
    </svg>
  )
}

function NavPill() {
  const [active, setActive] = useState(false)
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
      audioRef.current.play().catch(() => {})
    }
    setActive(!active)
  }, [active])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  return (

    <div className="absolute top-8 left-[85%] flex items-center rounded-full" style={{
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.04)',
      padding: '5px 8px',
      gap: 6,
    }}>
      <a href="#work" className="font-mono text-[9px] tracking-[4px] uppercase px-5 py-2 rounded-full transition-all duration-300 hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.55)' }}>
        Work
      </a>
      <button
        onClick={toggle}
        className="mx-2 px-3 py-1 flex items-center justify-center cursor-pointer rounded-full transition-all duration-300 hover:bg-white/10"
        style={{ background: 'none', border: 'none' }}
        title="Toggle Music"
      >
        <SineWave active={active} />
      </button>
      <a href="#contact" className="font-mono text-[9px] tracking-[4px] uppercase px-5 py-2 rounded-full transition-all duration-300 hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.55)' }}>
        Contact
      </a>
    </div>
  )
}

export default function TuskHero() {
  const [ready, setReady] = useState(false)
  /** 0–1, same curve as particle morph into “TUSK AI” (must stay in sync with Particles useFrame). */
  const [textFormProgress, setTextFormProgress] = useState(0)
  // Keep headline/CTA hidden until the TUSK AI particle text is fully formed.
  const heroCopyProgress = Math.max(0, Math.min(1, (textFormProgress - 0.9) / 0.1))
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      const fov = 52 * (Math.PI / 180)
      const aspect = window.innerWidth / window.innerHeight
      const z = 3.8
      mouseWorld.x = x * Math.tan(fov / 2) * aspect * z
      mouseWorld.y = y * Math.tan(fov / 2) * z
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
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
      const rawText = Math.max(0, Math.min(1, (progress - 0.45) / 0.55))
      const textE = easeInOutCubic(rawText)
      setTextFormProgress(textE)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <section ref={sectionRef} id="hero" className="relative w-full" style={{ height: '350vh', 
        // background: BG_COLOR 
        }}>
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 52 }}
            gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
            className="absolute! inset-0"
          >
            {/* <color attach="background" args={[BG_COLOR]} /> */}
            <Particles />
          </Canvas>


          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none" style={{
            opacity: ready && textFormProgress < 0.35 ? 1 : 0,
            transition: 'opacity 0.6s',
          }}>
            <span className="font-mono text-[8px] tracking-[5px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll to reveal</span>
            <div className="w-px h-8 animate-pulse" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
          </div>

          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            <nav className="flex items-center justify-between px-8 pt-12 pointer-events-auto z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-mono text-[10px] tracking-[5px] font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tusk AI
                </span>
              </div>

              <NavPill />
            </nav>

            <div
              className="flex flex-col items-center z-10 px-6 pb-16 md:pb-20 w-full max-w-[100vw]"
              style={{
                opacity: heroCopyProgress,
                transform: `translateY(${(1 - heroCopyProgress) * 28}px)`,
                transition: 'opacity 0.55s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: heroCopyProgress > 0.2 ? 'auto' : 'none',
              }}
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-snug mb-5 max-w-3xl px-2"
                style={{ color: 'rgba(255,255,255,0.95)' }}>
                Stop managing workflows.{' '}
                <span style={{ color: 'rgba(255,255,255,0.62)' }}>
                  Let AI orchestrate them.
                </span>
              </h1>
              <p className="text-sm md:text-base leading-7 max-w-xl text-center mb-10"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
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
    </>
  )
}
