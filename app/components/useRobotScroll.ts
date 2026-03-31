// hooks/useRobotScroll.ts
import { useEffect, useRef } from 'react'

export type RobotKeyframe = {
  scrollPercent: number
  position: [number, number, number]
  rotation: [number, number, number]
  animationName: 'greeting' | 'smile'
  label: string
}

export const ROBOT_KEYFRAMES: RobotKeyframe[] = [
  {
    scrollPercent: 0,
    position: [0, -0.5, 0],
    rotation: [0, -0.3, 0],
    animationName: 'greeting',
    label: 'Hero – center, greeting the user on arrival',
  },
  {
    scrollPercent: 20,
    position: [2.2, -0.5, 0],
    rotation: [0, -0.6, 0],
    animationName: 'smile',
    label: 'Hero bottom – slid right, smiling',
  },
  {
    scrollPercent: 35,
    position: [-2.2, -0.2, 0],
    rotation: [0, 0.6, 0],
    animationName: 'greeting',
    label: 'AI Architecture – left side, greeting the section',
  },
  {
    scrollPercent: 50,
    position: [-2.2, -0.2, 0],
    rotation: [0, 0.3, 0],
    animationName: 'smile',
    label: 'AI Architecture mid – still left, smiling',
  },
  {
    scrollPercent: 65,
    position: [0, -0.8, 1],
    rotation: [0, 0, 0],
    animationName: 'greeting',
    label: 'Gallery – center, greeting gallery visitors',
  },
  {
    scrollPercent: 80,
    position: [2.0, -0.8, 0],
    rotation: [0, -0.5, 0],
    animationName: 'smile',
    label: 'Gallery end – moved right, smiling farewell',
  },
  {
    scrollPercent: 92,
    position: [2.0, -1.0, 0],
    rotation: [0, -0.8, 0],
    animationName: 'greeting',
    label: 'Bottom – last wave goodbye',
  },
  {
    scrollPercent: 100,
    position: [3.2, -1.4, -0.5],
    rotation: [0, -1.1, 0],
    animationName: 'smile',
    label: 'End – exiting right with a smile',
  },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export type RobotTarget = {
  position: [number, number, number]
  rotation: [number, number, number]
  animationName: 'greeting' | 'smile'
  opacity: number  // ← add this
}

// Returns a ref — NO React state, NO re-renders
export function useRobotScroll() {
  const targetRef = useRef<RobotTarget>({
    position: [...ROBOT_KEYFRAMES[0].position],
    rotation: [...ROBOT_KEYFRAMES[0].rotation],
    animationName: ROBOT_KEYFRAMES[0].animationName,
    opacity: 0,  // ← starts invisible
  })

  useEffect(() => {
     const startTime = performance.now() + 400  // 400ms delay
    const duration = 1200

    let rafId: number
    const introAnim = () => {
      const now = performance.now()
      const elapsed = now - startTime
      if (elapsed < 0) { rafId = requestAnimationFrame(introAnim); return }

      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)  // ease-out cubic

      targetRef.current.opacity = eased
      // Rise up from below during intro
      targetRef.current.position[1] = lerp(-2.5, ROBOT_KEYFRAMES[0].position[1], eased)

      if (t < 1) rafId = requestAnimationFrame(introAnim)
    }
    rafId = requestAnimationFrame(introAnim)

    const onScroll = () => {
      const doc = document.documentElement
      const maxScroll = doc.scrollHeight - doc.clientHeight
      const pct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0
      const kf = ROBOT_KEYFRAMES

      let fromIdx = 0
      for (let i = kf.length - 1; i >= 0; i--) {
        if (pct >= kf[i].scrollPercent) { fromIdx = i; break }
      }
      const toIdx = Math.min(fromIdx + 1, kf.length - 1)
      const from = kf[fromIdx]
      const to = kf[toIdx]

      let t = 0
      if (toIdx !== fromIdx) {
        const range = to.scrollPercent - from.scrollPercent
        t = range > 0 ? (pct - from.scrollPercent) / range : 0
        t = Math.max(0, Math.min(1, easeInOut(t)))
      }

      // Mutate the ref directly — zero React overhead
      const target = targetRef.current
      target.position[0] = lerp(from.position[0], to.position[0], t)
      target.position[1] = lerp(from.position[1], to.position[1], t)
      target.position[2] = lerp(from.position[2], to.position[2], t)
      target.rotation[0] = lerp(from.rotation[0], to.rotation[0], t)
      target.rotation[1] = lerp(from.rotation[1], to.rotation[1], t)
      target.rotation[2] = lerp(from.rotation[2], to.rotation[2], t)
      // Only switch animation at 80% through transition to avoid rapid toggling
      target.animationName = t > 0.8 ? to.animationName : from.animationName
    }

   window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)}
  }, [])

  return targetRef
}