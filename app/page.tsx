// app/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "./components/LoadingScreen";

const ScrollRobot    = dynamic(() => import("./components/ScrollRobot"),      { ssr: false })
const TuskHero       = dynamic(() => import("./components/TuskHero"),         { ssr: false })
const AIArchitecture = dynamic(() => import("./components/AIArchitecture"),   { ssr: false })
const GallerySection = dynamic(() => import("./components/Spinalcord"),       { ssr: false })
const StarField      = dynamic(() => import("./components/StarField"),        { ssr: false })

const MIN_LOAD_TIME = 15000

function startLoader(onProgress: (p: number) => void): void {
  const start = Date.now()
  import("./components/TuskHero").catch(() => {})
  import("./components/AIArchitecture").catch(() => {})
  import("./components/Spinalcord").catch(() => {})
  import("three").catch(() => {})
  import("@react-three/fiber").catch(() => {})
  fetch("/spinal_cord.glb").catch(() => {})

  const interval = setInterval(() => {
    const elapsed = Date.now() - start
    const p = Math.min((elapsed / MIN_LOAD_TIME) * 100, 100)
    onProgress(p)
    if (p >= 100) clearInterval(interval)
  }, 100)
}

// How many "vh" the gallery section holds the user (= scroll travel inside section)
const GALLERY_SCROLL_VH = 400

export default function Home() {
  const [progress, setProgress]   = useState(0)
  const [loaded, setLoaded]       = useState(false)
  const [showRobot, setShowRobot] = useState(false)

  // ── Scroll-lock state ──────────────────────────────────────────────────────
  // virtualScroll: how many px the user has "spent" inside the gallery section
  const virtualScrollRef  = useRef(0)
  const isLockedRef       = useRef(false)
  const galleryWrapperRef = useRef<HTMLDivElement>(null)
  const lastTouchY        = useRef(0)

  const handleComplete = useCallback(() => {
    setLoaded(true)
    setTimeout(() => setShowRobot(true), 100)
  }, [])

  useEffect(() => {
    startLoader((p) => setProgress(p))
  }, [])

  // ── Scroll-lock logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return

    const GALLERY_SCROLL_PX = (GALLERY_SCROLL_VH / 100) * window.innerHeight

    // Returns true if the gallery section is currently "in the viewport centre"
    // i.e. the user has scrolled to it but not past it
    const isGalleryInView = (): boolean => {
      const el = galleryWrapperRef.current
      if (!el) return false
      const rect = el.getBoundingClientRect()
      // Section is active when its top edge is at or above viewport top
      // and its bottom edge is still below viewport bottom
      return rect.top <= 0 && rect.bottom >= window.innerHeight
    }

    // Translate virtual scroll progress into a real translateY on the inner
    // sticky content — the page itself stays fixed while locked
    const applyVirtualScroll = () => {
      const el = galleryWrapperRef.current
      if (!el) return
      const frac = Math.min(Math.max(virtualScrollRef.current / GALLERY_SCROLL_PX, 0), 1)
      // Store on dataset so Spinalcord can read it without another DOM query
      el.dataset.scrollFrac = String(frac)
    }

    // ── Wheel handler ────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      if (!isGalleryInView()) {
        isLockedRef.current = false
        return
      }

      const prev = virtualScrollRef.current
      const next = prev + e.deltaY

      // Still inside the gallery section
      if (next >= 0 && next <= GALLERY_SCROLL_PX) {
        e.preventDefault()
        isLockedRef.current = true
        virtualScrollRef.current = next
        applyVirtualScroll()
        return
      }

      // Trying to scroll before section start — let native scroll happen
      if (next < 0) {
        isLockedRef.current = false
        return
      }

      // Finished scrolling through gallery — unlock and let page scroll
      if (next > GALLERY_SCROLL_PX) {
        isLockedRef.current = false
        virtualScrollRef.current = GALLERY_SCROLL_PX
        applyVirtualScroll()
      }
    }

    // ── Touch handlers ───────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isGalleryInView()) return
      const deltaY = lastTouchY.current - e.touches[0].clientY
      lastTouchY.current = e.touches[0].clientY

      const prev = virtualScrollRef.current
      const next = prev + deltaY

      if (next >= 0 && next <= GALLERY_SCROLL_PX) {
        e.preventDefault()
        virtualScrollRef.current = next
        applyVirtualScroll()
      } else if (next > GALLERY_SCROLL_PX) {
        virtualScrollRef.current = GALLERY_SCROLL_PX
        applyVirtualScroll()
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })

    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [loaded])

  useEffect(() => {
    // Always open at top so hero particles are the first viewport.
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = loaded ? "" : "hidden";

    // Ensure we reveal content from the hero after loader completes.
    if (loaded) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [loaded]);

  return (
    <main className="bg-[#020008] min-h-screen relative">
      {!loaded && <LoadingScreen progress={progress} onComplete={handleComplete} />}

      {showRobot && <ScrollRobot />}

      <StarField density="low" />
      <TuskHero />
      <div style={{ height: '200px', background: '#020008' }} />
      <AIArchitecture />
      <div style={{ height: '200px', background: '#020008' }} />

      <div
        ref={galleryWrapperRef}
        data-gallery-scroll
        style={{
          // Tall enough that native scroll can't jump past it in one flick,
          // but the ACTUAL travel is controlled by the wheel handler above.
          height: `${GALLERY_SCROLL_VH}vh`,
          position: 'relative',
        }}
      >
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <GallerySection />
        </div>
      </div>

      <div className="h-screen w-screen" />
    </main>
  )
}
