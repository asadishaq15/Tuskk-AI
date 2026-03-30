'use client'

import dynamic from "next/dynamic";

const TuskHero = dynamic(() => import("./components/TuskHero"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: '#020008' }}>
      <div className="font-mono text-[10px] tracking-[6px] uppercase animate-pulse" style={{ color: 'rgba(167,139,250,0.4)' }}>
        INITIALIZING TUSK
      </div>
    </div>
  ),
});

const AIArchitecture = dynamic(() => import("./components/AIArchitecture"), {
  ssr: false,
});

const GallerySection = dynamic(() => import("./components/Spinalcord"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="bg-[#020008] min-h-screen">
      <TuskHero />
      <div style={{ height: '200px', background: '#020008' }} />
      <AIArchitecture />
      <GallerySection />         
      <div className="h-screen w-screen"></div>
    </main>
  );
}