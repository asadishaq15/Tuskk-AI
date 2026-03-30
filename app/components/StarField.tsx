'use client'

import { useMemo } from 'react'

interface StarProps {
  density?: 'low' | 'medium'
}

export default function StarField({ density = 'low' }: StarProps) {
  const count = density === 'low' ? 40 : 70

  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() < 0.6 ? 1 : Math.random() * 1.5 + 1,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 3,
    })),
    [count]
  )

  return (
    <>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              backgroundColor: `rgba(255, 255, 255, ${s.opacity})`,
              boxShadow: s.size > 1.5 ? `0 0 ${s.size * 2}px rgba(255,255,255,${s.opacity * 0.4})` : 'none',
              animation: `starTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <style jsx global>{`
        @keyframes starTwinkle {
          0% { opacity: 0.15; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
