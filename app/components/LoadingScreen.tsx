'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'

interface LoadingScreenProps {
  progress: number
  onComplete: () => void
}

interface Star {
  id: number
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  opacity: number
  twinklePhase: number
  twinkleSpeed: number
}

export default function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)

  const initStars = useCallback(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const count = 120

    starsRef.current = Array.from({ length: count }, (_, i) => {
      const x = Math.random() * w
      const y = Math.random() * h
      return {
        id: i,
        x, y,
        baseX: x,
        baseY: y,
        vx: 0, vy: 0,
        size: Math.random() < 0.5 ? 1 : Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 2 + 1,
      }
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (starsRef.current.length === 0) initStars()
    }

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('mouseleave', handleLeave)

    const REPULSE_RADIUS = 120
    const REPULSE_FORCE = 8
    const RETURN_SPEED = 0.04
    const DAMPING = 0.9

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = performance.now() / 1000
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (const star of starsRef.current) {
        const dx = star.x - mx
        const dy = star.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < REPULSE_RADIUS && dist > 0.1) {
          const force = ((REPULSE_RADIUS - dist) / REPULSE_RADIUS) * REPULSE_FORCE
          star.vx += (dx / dist) * force
          star.vy += (dy / dist) * force
        }

        star.vx += (star.baseX - star.x) * RETURN_SPEED
        star.vy += (star.baseY - star.y) * RETURN_SPEED

        star.vx *= DAMPING
        star.vy *= DAMPING

        star.x += star.vx
        star.y += star.vy

        const twinkle = Math.sin(now * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
        const alpha = star.opacity * (0.3 + twinkle * 0.7)

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fill()

        if (star.size > 1.5) {
          const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.25})`)
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseleave', handleLeave)
    }
  }, [initStars])

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          setVisible(false)
          onComplete()
        }, 800)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [progress, onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        zIndex: 9999,
        background: '#020008',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="flex flex-col items-center z-10">
        <h1
          className="font-poppins font-[800] text-center text-[calc(165/19.2*1vw)] max-lg:text-[calc(100/10.24*1vw)] max-md:text-[64px] max-sm:text-[48px] max-xs:text-[42px]"
          style={{
            color: '#f0f0f0',
            transform: 'translate(20px, 0px)',
            opacity: 1,
            lineHeight: 1,
            marginBottom: '40px',
          }}
        >
          Tusk AI
        </h1>

        <div className="flex flex-col items-center gap-4 w-[320px] max-sm:w-[240px]">
          <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, rgba(167,139,250,0.6), rgba(255,255,255,0.8))',
                boxShadow: '0 0 12px rgba(167,139,250,0.4)',
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
          <span className="font-mono text-[13px] tracking-[3px]"
            style={{ color: 'rgba(167,139,250,0.5)' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>
    </div>
  )
}
