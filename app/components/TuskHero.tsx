'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────────
const PARTICLE_COUNT  = 18000
const TEXT_PARTICLES  = 8000
const PARTICLE_SIZE   = 0.025
const SCATTER_RADIUS  = 25
const GATHER_DURATION = 3.5
const GATHER_DELAY    = 0.8
const TWINKLE_SPEED   = 2.5

const easeInOutQuart = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4) / 2

function getTextPoints(text: string, count: number, width: number, height: number): Float32Array {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 180px "Arial Black", "Impact", sans-serif'
  ctx.fillText(text, width / 2, height / 2)

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data
  const filledPixels: [number, number][] = []
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4
      if (pixels[idx + 3] > 128) filledPixels.push([x, y])
    }
  }

  const positions = new Float32Array(count * 3)
  const scaleX = 12 / width
  const scaleY = 5 / height
  for (let i = 0; i < count; i++) {
    const pixel = filledPixels[Math.floor(Math.random() * filledPixels.length)]
    positions[i * 3]     = (pixel[0] - width / 2) * scaleX
    positions[i * 3 + 1] = -(pixel[1] - height / 2) * scaleY
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15
  }
  return positions
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const geoRef    = useRef<THREE.BufferGeometry>(null)
  const startTime = useRef<number | null>(null)
  const gathered  = useRef(false)

  const textTargets = useMemo(() => {
    if (typeof document === 'undefined') return new Float32Array(TEXT_PARTICLES * 3)
    return getTextPoints('TUSK AI', TEXT_PARTICLES, 1024, 256)
  }, [])

  const { scatterPos, currentPos, colors, stagger, sizes } = useMemo(() => {
    const scatter = new Float32Array(PARTICLE_COUNT * 3)
    const current = new Float32Array(PARTICLE_COUNT * 3)
    const cols    = new Float32Array(PARTICLE_COUNT * 3)
    const stag    = new Float32Array(PARTICLE_COUNT)
    const sz      = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 3 + Math.random() * SCATTER_RADIUS
      scatter[i*3] = r * Math.sin(phi) * Math.cos(theta)
      scatter[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      scatter[i*3+2] = r * Math.cos(phi)
      current[i*3] = scatter[i*3]; current[i*3+1] = scatter[i*3+1]; current[i*3+2] = scatter[i*3+2]
      stag[i] = Math.random() * 0.5

      if (i < TEXT_PARTICLES) {
        const b = 0.7 + Math.random() * 0.3
        cols[i*3] = 0.65*b; cols[i*3+1] = 0.55*b; cols[i*3+2] = 0.98*b
      } else {
        const b = 0.2 + Math.random() * 0.5
        const t = Math.random()
        if (t < 0.4) { cols[i*3]=b*0.8; cols[i*3+1]=b*0.7; cols[i*3+2]=b }
        else if (t < 0.7) { cols[i*3]=b; cols[i*3+1]=b*0.6; cols[i*3+2]=b*0.9 }
        else { cols[i*3]=b*0.5; cols[i*3+1]=b*0.5; cols[i*3+2]=b*0.7 }
      }
      sz[i] = i < TEXT_PARTICLES ? PARTICLE_SIZE*(0.6+Math.random()*0.8) : PARTICLE_SIZE*(0.3+Math.random()*0.5)
    }
    return { scatterPos: scatter, currentPos: current, colors: cols, stagger: stag, sizes: sz }
  }, [])

  useFrame(({ clock }) => {
    const geo = geoRef.current, pts = pointsRef.current
    if (!geo || !pts) return
    const now = clock.getElapsedTime()
    if (startTime.current === null) startTime.current = now
    const elapsed = now - startTime.current - GATHER_DELAY
    const mat = pts.material as THREE.PointsMaterial
    mat.opacity = Math.min((now - startTime.current) / 1.0, 1) ** 2

    const posArr = geo.attributes.position.array as Float32Array
    const colArr = geo.attributes.color.array as Float32Array
    const sizeArr = geo.attributes.size.array as Float32Array

    if (elapsed > 0) {
      const rawT = Math.min(elapsed / GATHER_DURATION, 1)
      for (let i = 0; i < TEXT_PARTICLES; i++) {
        const lt = Math.max(0, Math.min((rawT - stagger[i]) / (1 - stagger[i]), 1))
        const e = easeInOutQuart(lt)
        posArr[i*3]   = scatterPos[i*3]   + (textTargets[i*3]   - scatterPos[i*3])   * e
        posArr[i*3+1] = scatterPos[i*3+1] + (textTargets[i*3+1] - scatterPos[i*3+1]) * e
        posArr[i*3+2] = scatterPos[i*3+2] + (textTargets[i*3+2] - scatterPos[i*3+2]) * e
      }
      if (rawT >= 1) gathered.current = true
    }

    for (let i = TEXT_PARTICLES; i < PARTICLE_COUNT; i++) {
      const p = i * 1.37 + now * 0.08
      posArr[i*3]   = scatterPos[i*3]   + Math.sin(p) * 0.02
      posArr[i*3+1] = scatterPos[i*3+1] + Math.cos(p*0.7) * 0.015
      posArr[i*3+2] = scatterPos[i*3+2] + Math.sin(p*1.3) * 0.01
    }

    if (gathered.current) {
      for (let i = 0; i < TEXT_PARTICLES; i++) {
        const tw = 0.7 + Math.sin(now*TWINKLE_SPEED + i*0.47)*0.3
        const base = 0.7 + (i%100)/100*0.3
        colArr[i*3]=0.65*base*tw; colArr[i*3+1]=0.55*base*tw; colArr[i*3+2]=0.98*base*tw
        sizeArr[i] = sizes[i]*(0.85 + Math.sin(now*TWINKLE_SPEED*1.3 + i*0.31)*0.15)
      }
      geo.attributes.color.needsUpdate = true
    }
    for (let i = TEXT_PARTICLES; i < PARTICLE_COUNT; i++) {
      sizeArr[i] = sizes[i]*(0.6 + (0.5+Math.sin(now*1.5+i*2.13)*0.5)*0.4)
    }
    geo.attributes.size.needsUpdate = true
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[currentPos, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        <bufferAttribute attach="attributes-size"     args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={PARTICLE_SIZE} vertexColors transparent opacity={0} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}

function CameraDrift() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.05) * 0.3
    camera.position.y = Math.cos(t * 0.07) * 0.15
    camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── Hero Section Export ──────────────────────────────────────────────────────
export default function TuskHero() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <section id="hero" className="relative w-full h-screen overflow-hidden" style={{ background: '#020008' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        className="!absolute inset-0"
      >
        <color attach="background" args={['#020008']} />
        <Particles />
        <CameraDrift />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 pointer-events-auto z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-mono text-[10px] tracking-[5px] font-semibold uppercase" style={{ color:'rgba(167,139,250,0.8)' }}>
              Tusk AI
            </span>
          </div>
          <div className="hidden md:flex gap-8">
            {['Platform', 'Solutions', 'Pricing', 'About'].map(item => (
              <span key={item} className="font-mono text-[9px] tracking-[3px] uppercase cursor-pointer transition-colors duration-200 hover:text-violet-300"
                style={{ color:'rgba(167,139,250,0.35)' }}>{item}</span>
            ))}
          </div>
          <a href="#architecture" className="px-5 py-2 border rounded-md text-[9px] tracking-[3px] uppercase font-mono cursor-pointer transition-all duration-200 hover:bg-violet-500/10 hover:text-violet-300 pointer-events-auto"
            style={{ borderColor:'rgba(167,139,250,0.4)', color:'rgba(167,139,250,0.7)', background:'transparent' }}>
            Get Started
          </a>
        </nav>

        {/* Headline + CTA */}
        <div className="flex flex-col items-center pb-20 z-10 px-6" style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 1.8s cubic-bezier(0.16, 1, 0.3, 1) 3.5s',
        }}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight mb-5 max-w-3xl"
            style={{ color:'#ede9fe', textShadow:'0 0 80px rgba(109,40,217,0.2)' }}>
            Stop managing workflows.{' '}
            <span style={{ background:'linear-gradient(95deg, #c084fc, #818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Let AI orchestrate them.
            </span>
          </h1>
          <p className="text-sm md:text-base leading-7 max-w-xl text-center mb-10"
            style={{ color:'rgba(196,181,253,0.45)' }}>
            Tusk AI replaces repetitive operational work with intelligent automation pipelines
            that learn, adapt, and execute — so you can focus on what matters.
          </p>
          <a href="#architecture" className="pointer-events-auto px-8 py-3.5 rounded-md text-[10px] tracking-[4px] uppercase font-mono cursor-pointer transition-all duration-300 hover:shadow-[0_0_40px_rgba(109,40,217,0.3)]"
            style={{
              background:'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border:'1px solid rgba(167,139,250,0.5)',
              color:'#fff',
              boxShadow:'0 0 24px rgba(109,40,217,0.25)',
            }}>
            Initiate a Workflow Audit
          </a>
        </div>
      </div>
    </section>
  )
}
