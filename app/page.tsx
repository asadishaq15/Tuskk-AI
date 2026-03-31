'use client'

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "./components/LoadingScreen";

const TuskHero = dynamic(() => import("./components/TuskHero"), { ssr: false });
const AIArchitecture = dynamic(() => import("./components/AIArchitecture"), { ssr: false });
const GallerySection = dynamic(() => import("./components/Spinalcord"), { ssr: false });
const StarField = dynamic(() => import("./components/StarField"), { ssr: false });

const MIN_LOAD_TIME = 15000;

function startLoader(onProgress: (p: number) => void): void {
  const start = Date.now();

  import("./components/TuskHero").catch(() => {});
  import("./components/AIArchitecture").catch(() => {});
  import("./components/Spinalcord").catch(() => {});
  import("three").catch(() => {});
  import("@react-three/fiber").catch(() => {});
  fetch("/spinal_cord.glb").catch(() => {});

  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const p = Math.min((elapsed / MIN_LOAD_TIME) * 100, 100);
    onProgress(p);
    if (p >= 100) clearInterval(interval);
  }, 100);
}

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const handleComplete = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    startLoader((p) => setProgress(p));
  }, []);

  return (
    <main className="bg-[#020008] min-h-screen relative">
      {!loaded && <LoadingScreen progress={progress} onComplete={handleComplete} />}

      <StarField density="low" />
      <TuskHero />
      <div style={{ height: '200px', background: '#020008' }} />
      <AIArchitecture />
      <div style={{ height: '200px', background: '#020008' }} />

      <div data-gallery-scroll style={{ height: '400vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <GallerySection />
        </div>
      </div>

      <div className="h-screen w-screen" />
    </main>
  );
}
