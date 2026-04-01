// components/ScrollRobot.tsx
'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useRobotScroll, RobotTarget } from './useRobotScroll'
import * as THREE from 'three'

const LERP_SPEED = 4

function RobotMesh({ targetRef }: { targetRef: React.MutableRefObject<RobotTarget> }) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials, animations } = useGLTF('/robort.glb')
  const { actions, names } = useAnimations(animations, group)

  const currentAnim = useRef<string | null>(null)
  const pendingAnim = useRef<string | null>(null)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mount: play first animation
  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]!.reset().play()
      currentAnim.current = names[0]
    }
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    }
  }, [actions, names])

  useFrame((_, delta) => {
    if (!group.current) return
    const target = targetRef.current
    const s = Math.min(1, LERP_SPEED * delta)
    group.current.visible = target.opacity > 0.01

    group.current.position.x += (target.position[0] - group.current.position.x) * s
    group.current.position.y += (target.position[1] - group.current.position.y) * s
    group.current.position.z += (target.position[2] - group.current.position.z) * s
    group.current.rotation.x += (target.rotation[0] - group.current.rotation.x) * s
    group.current.rotation.y += (target.rotation[1] - group.current.rotation.y) * s
    group.current.rotation.z += (target.rotation[2] - group.current.rotation.z) * s

    // Debounced anim switch — only trigger if target held stable for 300ms
    const desired = target.animationName
    if (desired !== currentAnim.current && desired !== pendingAnim.current) {
      pendingAnim.current = desired
      if (animTimer.current) clearTimeout(animTimer.current)
      animTimer.current = setTimeout(() => {
        if (pendingAnim.current !== currentAnim.current) {
          const match = names.find(n => n.toLowerCase().includes(pendingAnim.current!.toLowerCase())) ?? names[0]
          if (match && actions[match] && match !== currentAnim.current) {
            if (currentAnim.current && actions[currentAnim.current]) {
              actions[currentAnim.current]!.fadeOut(0.6)
            }
            actions[match]!.reset().fadeIn(0.6).play()
            currentAnim.current = match
          }
        }
        pendingAnim.current = null
      }, 300)
    }
  })

  return (
    <group ref={group} dispose={null}>
      <group name="Scene">
        <group name="Armature002" rotation={[-Math.PI / 2, 0, 0]} scale={0.4}>
          <group name="Robot002">
            <skinnedMesh
              name="Circle004"
              geometry={(nodes.Circle004 as any).geometry}
              material={materials['Texture 01']}
              skeleton={(nodes.Circle004 as any).skeleton}
            />
            <skinnedMesh
              name="Circle004_1"
              geometry={(nodes.Circle004_1 as any).geometry}
              material={materials['Glass 02']}
              skeleton={(nodes.Circle004_1 as any).skeleton}
            />
          </group>
          <primitive object={nodes.Root} />
          <primitive object={nodes.neck} />
          <primitive object={nodes.ShoulderR} />
          <primitive object={nodes.ShoulderL} />
        </group>
      </group>
    </group>
  )
}

export default function ScrollRobot() {
  const targetRef = useRobotScroll()
  const [mounted, setMounted] = useState(false)

  // Delay mount until after page has settled — prevents fighting other canvases
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 500)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{
          alpha: true,
          antialias: false,          // ← OFF: saves ~30% GPU on transparent canvas
          powerPreference: 'default', // ← not 'high-performance': reduces context pressure
          depth: true,
          stencil: false,            // ← OFF: not needed, saves memory
          logarithmicDepthBuffer: false,
        }}
        dpr={1}                      // ← hard 1x, no retina scaling at all
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)  // fully transparent clear
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <pointLight position={[-3, 2, 2]} intensity={0.6} color="#a0c4ff" />
        <RobotMesh targetRef={targetRef} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/robort.glb')