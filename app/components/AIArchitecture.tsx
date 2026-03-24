'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

function DataParticle({ path, duration, delay, color, size = 4 }: {
  path: string
  duration: number
  delay: number
  color: string
  size?: number
}) {
  return (
    <circle r={size} fill={color} filter="url(#glow)">
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
      />
    </circle>
  )
}

const TOTAL_STEPS = 5
const STEP_COOLDOWN = 600

export default function AIArchitecture() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const lockedRef = useRef(false)
  const doneRef = useRef(false)
  const stepRef = useRef(0)
  const cooldownRef = useRef(false)
  const touchYRef = useRef(0)

  const sectionInView = useCallback(() => {
    const el = sectionRef.current
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.top <= 80 && rect.bottom >= window.innerHeight * 0.5
  }, [])

  const advanceStep = useCallback(() => {
    if (cooldownRef.current || doneRef.current) return
    if (stepRef.current >= TOTAL_STEPS) {
      doneRef.current = true
      lockedRef.current = false
      return
    }
    cooldownRef.current = true
    stepRef.current += 1
    setStep(stepRef.current)
    if (stepRef.current >= TOTAL_STEPS) {
      doneRef.current = true
      lockedRef.current = false
    }
    setTimeout(() => { cooldownRef.current = false }, STEP_COOLDOWN)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (doneRef.current) return
      if (sectionInView() && !lockedRef.current) {
        lockedRef.current = true
        if (stepRef.current === 0) advanceStep()
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (!lockedRef.current || doneRef.current) return
      e.preventDefault()
      if (e.deltaY > 0) {
        advanceStep()
      } else if (e.deltaY < 0 && stepRef.current <= 1) {
        lockedRef.current = false
        doneRef.current = false
        stepRef.current = 0
        setStep(0)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!lockedRef.current || doneRef.current) return
      const dy = touchYRef.current - e.touches[0].clientY
      touchYRef.current = e.touches[0].clientY
      if (dy > 8) {
        e.preventDefault()
        advanceStep()
      } else if (dy < -8 && stepRef.current <= 1) {
        lockedRef.current = false
        doneRef.current = false
        stepRef.current = 0
        setStep(0)
      } else if (Math.abs(dy) > 3) {
        e.preventDefault()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!lockedRef.current || doneRef.current) return
      if (['ArrowDown', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        advanceStep()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [sectionInView, advanceStep])

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: '#020008', width: '100%', minHeight: '100vh' }}
    >
      <div className="w-full h-screen overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(167,139,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {/* Step indicator */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2" style={{
          opacity: step > 0 ? 1 : 0,
          transition: 'opacity 0.5s',
        }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="w-1.5 rounded-full transition-all duration-500" style={{
              height: step >= i + 1 ? '20px' : '8px',
              background: step >= i + 1 ? 'rgba(167,139,250,0.7)' : 'rgba(167,139,250,0.15)',
            }} />
          ))}
        </div>

        {/* Section header */}
        <div className="relative z-10 mb-8 px-6" style={{
          maxWidth: '900px',
          margin: '0 auto 32px',
          textAlign: 'center',
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '1px', background: 'rgba(167,139,250,0.4)' }} />
            <span className="font-mono text-[9px] tracking-[6px] uppercase" style={{ color: 'rgba(167,139,250,0.5)' }}>
              AI Architecture
            </span>
            <div style={{ width: '32px', height: '1px', background: 'rgba(167,139,250,0.4)' }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ede9fe' }}>
            How Tusk AI{' '}
            <span style={{ background: 'linear-gradient(95deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Processes Data
            </span>
          </h2>
          <p className="text-sm md:text-base leading-7" style={{ color: 'rgba(196,181,253,0.4)', maxWidth: '600px', margin: '0 auto' }}>
            Data flows through two specialized AI engines — each handling different
            aspects of your operations — and produces structured, actionable outputs.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative z-10" style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 24px' }}>
          <svg viewBox="0 0 1000 480" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="engineGlow">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4285f4" /><stop offset="100%" stopColor="#1a73e8" />
              </linearGradient>
              <linearGradient id="openaiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10a37f" /><stop offset="100%" stopColor="#0d8c6d" />
              </linearGradient>
              <linearGradient id="outputGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* ── LEFT: INPUT DATA SOURCES ── */}
            <g style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateX(0)' : 'translateX(-40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <rect x="80" y="60" width="160" height="52" rx="8" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
              <text x="160" y="82" textAnchor="middle" fill="rgba(167,139,250,0.7)" fontSize="11" fontFamily="monospace">✉ Emails</text>
              <text x="160" y="100" textAnchor="middle" fill="rgba(167,139,250,0.35)" fontSize="8" fontFamily="monospace">INBOUND DATA</text>

              <rect x="80" y="132" width="160" height="52" rx="8" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
              <text x="160" y="154" textAnchor="middle" fill="rgba(167,139,250,0.7)" fontSize="11" fontFamily="monospace">📄 Documents</text>
              <text x="160" y="172" textAnchor="middle" fill="rgba(167,139,250,0.35)" fontSize="8" fontFamily="monospace">CONTRACTS · REPORTS</text>

              <rect x="80" y="252" width="160" height="52" rx="8" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
              <text x="160" y="274" textAnchor="middle" fill="rgba(167,139,250,0.7)" fontSize="11" fontFamily="monospace">📊 Spreadsheets</text>
              <text x="160" y="292" textAnchor="middle" fill="rgba(167,139,250,0.35)" fontSize="8" fontFamily="monospace">FINANCIALS · LOGS</text>

              <rect x="80" y="324" width="160" height="52" rx="8" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
              <text x="160" y="346" textAnchor="middle" fill="rgba(167,139,250,0.7)" fontSize="11" fontFamily="monospace">⚡ Tasks</text>
              <text x="160" y="364" textAnchor="middle" fill="rgba(167,139,250,0.35)" fontSize="8" fontFamily="monospace">OPS · WORKFLOWS</text>
            </g>

            {/* ── INPUT → ENGINE STREAMS ── */}
            <g style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}>
              <path d="M240,86 C310,86 340,170 380,170" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M240,158 C310,158 340,170 380,170" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M240,278 C310,278 340,310 380,310" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M240,350 C310,350 340,310 380,310" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              {step >= 3 && <>
                <DataParticle path="M240,86 C310,86 340,170 380,170" duration={2.5} delay={0} color="#a78bfa" size={3} />
                <DataParticle path="M240,86 C310,86 340,170 380,170" duration={2.5} delay={1.2} color="#c084fc" size={2.5} />
                <DataParticle path="M240,158 C310,158 340,170 380,170" duration={2.8} delay={0.4} color="#818cf8" size={3} />
                <DataParticle path="M240,278 C310,278 340,310 380,310" duration={2.6} delay={0.8} color="#a78bfa" size={3} />
                <DataParticle path="M240,350 C310,350 340,310 380,310" duration={2.4} delay={0.2} color="#c084fc" size={2.5} />
              </>}
            </g>

            {/* ── GEMINI ENGINE ── */}
            <g style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'scale(1)' : 'scale(0.85)', transformOrigin: '500px 170px', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s' }}>
              <rect x="380" y="100" width="240" height="140" rx="12" fill="rgba(66,133,244,0.08)" stroke="rgba(66,133,244,0.3)" strokeWidth="1.5" filter="url(#engineGlow)" />
              <rect x="380" y="100" width="240" height="28" rx="12" fill="rgba(66,133,244,0.12)" />
              <circle cx="402" cy="114" r="7" fill="url(#geminiGrad)" />
              <text x="402" y="118" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">G</text>
              <text x="420" y="118" fill="rgba(66,133,244,0.9)" fontSize="10" fontWeight="bold" fontFamily="monospace">GEMINI ENGINE</text>
              <text x="605" y="118" textAnchor="end" fill="rgba(66,133,244,0.4)" fontSize="7" fontFamily="monospace">CONTEXT PROCESSING</text>
              <text x="400" y="152" fill="rgba(200,220,255,0.5)" fontSize="9" fontFamily="monospace">Large context interpretation</text>
              <text x="400" y="170" fill="rgba(200,220,255,0.35)" fontSize="8" fontFamily="monospace">• Complex document analysis</text>
              <text x="400" y="185" fill="rgba(200,220,255,0.35)" fontSize="8" fontFamily="monospace">• Large dataset comprehension</text>
              <text x="400" y="200" fill="rgba(200,220,255,0.35)" fontSize="8" fontFamily="monospace">• Multi-source correlation</text>
              <text x="400" y="215" fill="rgba(200,220,255,0.35)" fontSize="8" fontFamily="monospace">• Pattern recognition</text>
              <circle cx="596" cy="200" r="16" fill="none" stroke="rgba(66,133,244,0.3)" strokeWidth="1">
                <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="596" cy="200" r="6" fill="rgba(66,133,244,0.6)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* ── OPENAI ENGINE ── */}
            <g style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'scale(1)' : 'scale(0.85)', transformOrigin: '500px 310px', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}>
              <rect x="380" y="260" width="240" height="140" rx="12" fill="rgba(16,163,127,0.08)" stroke="rgba(16,163,127,0.3)" strokeWidth="1.5" filter="url(#engineGlow)" />
              <rect x="380" y="260" width="240" height="28" rx="12" fill="rgba(16,163,127,0.12)" />
              <circle cx="402" cy="274" r="7" fill="url(#openaiGrad)" />
              <text x="402" y="278" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">O</text>
              <text x="420" y="278" fill="rgba(16,163,127,0.9)" fontSize="10" fontWeight="bold" fontFamily="monospace">OPENAI ENGINE</text>
              <text x="605" y="278" textAnchor="end" fill="rgba(16,163,127,0.4)" fontSize="7" fontFamily="monospace">REASONING & LOGIC</text>
              <text x="400" y="312" fill="rgba(200,255,230,0.5)" fontSize="9" fontFamily="monospace">Reasoning & routing logic</text>
              <text x="400" y="330" fill="rgba(200,255,230,0.35)" fontSize="8" fontFamily="monospace">• Decision tree generation</text>
              <text x="400" y="345" fill="rgba(200,255,230,0.35)" fontSize="8" fontFamily="monospace">• Logic-based routing</text>
              <text x="400" y="360" fill="rgba(200,255,230,0.35)" fontSize="8" fontFamily="monospace">• Task orchestration</text>
              <text x="400" y="375" fill="rgba(200,255,230,0.35)" fontSize="8" fontFamily="monospace">• Output structuring</text>
              <circle cx="596" cy="360" r="16" fill="none" stroke="rgba(16,163,127,0.3)" strokeWidth="1">
                <animate attributeName="r" values="14;18;14" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="596" cy="360" r="6" fill="rgba(16,163,127,0.6)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.7s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* ── ENGINE → OUTPUT STREAMS ── */}
            <g style={{ opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}>
              <path d="M620,170 C680,170 700,130 760,130" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M620,170 C680,170 700,240 760,240" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M620,330 C680,330 700,240 760,240" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <path d="M620,330 C680,330 700,350 760,350" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              {step >= 4 && <>
                <DataParticle path="M620,170 C680,170 700,130 760,130" duration={2.2} delay={0.3} color="#c084fc" size={3} />
                <DataParticle path="M620,170 C680,170 700,240 760,240" duration={2.4} delay={0.7} color="#a78bfa" size={3} />
                <DataParticle path="M620,330 C680,330 700,240 760,240" duration={2.6} delay={0.1} color="#10a37f" size={3} />
                <DataParticle path="M620,330 C680,330 700,350 760,350" duration={2.3} delay={0.5} color="#818cf8" size={2.5} />
              </>}
            </g>

            {/* ── RIGHT: STRUCTURED OUTPUTS ── */}
            <g style={{ opacity: step >= 5 ? 1 : 0, transform: step >= 5 ? 'translateX(0)' : 'translateX(40px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <rect x="760" y="100" width="160" height="60" rx="8" fill="rgba(192,132,252,0.06)" stroke="rgba(192,132,252,0.25)" strokeWidth="1" />
              <text x="840" y="126" textAnchor="middle" fill="rgba(192,132,252,0.8)" fontSize="11" fontFamily="monospace">📊 Auto Reports</text>
              <text x="840" y="146" textAnchor="middle" fill="rgba(192,132,252,0.35)" fontSize="8" fontFamily="monospace">STRUCTURED OUTPUT</text>

              <rect x="760" y="210" width="160" height="60" rx="8" fill="rgba(192,132,252,0.06)" stroke="rgba(192,132,252,0.25)" strokeWidth="1" />
              <text x="840" y="236" textAnchor="middle" fill="rgba(192,132,252,0.8)" fontSize="11" fontFamily="monospace">⚡ Workflow Actions</text>
              <text x="840" y="256" textAnchor="middle" fill="rgba(192,132,252,0.35)" fontSize="8" fontFamily="monospace">AUTOMATED TASKS</text>

              <rect x="760" y="320" width="160" height="60" rx="8" fill="rgba(192,132,252,0.06)" stroke="rgba(192,132,252,0.25)" strokeWidth="1" />
              <text x="840" y="346" textAnchor="middle" fill="rgba(192,132,252,0.8)" fontSize="11" fontFamily="monospace">📄 Gen. Documents</text>
              <text x="840" y="366" textAnchor="middle" fill="rgba(192,132,252,0.35)" fontSize="8" fontFamily="monospace">AI-GENERATED</text>
            </g>

            {/* ── Flow labels ── */}
            <g style={{ opacity: step >= 3 ? 0.4 : 0, transition: 'opacity 1s ease' }}>
              <text x="160" y="440" textAnchor="middle" fill="rgba(167,139,250,0.3)" fontSize="8" fontFamily="monospace" letterSpacing="3">DATA INGESTION →</text>
              <text x="500" y="440" textAnchor="middle" fill="rgba(167,139,250,0.3)" fontSize="8" fontFamily="monospace" letterSpacing="3">AI PROCESSING →</text>
              <text x="840" y="440" textAnchor="middle" fill="rgba(192,132,252,0.3)" fontSize="8" fontFamily="monospace" letterSpacing="3">STRUCTURED OUTPUT</text>
            </g>
          </svg>
        </div>

        {/* Bottom CTA */}
        <div className="relative z-10" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '24px',
          opacity: step >= 5 ? 1 : 0,
          transform: step >= 5 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <p className="text-sm max-w-lg text-center mb-6" style={{ color: 'rgba(196,181,253,0.35)' }}>
            See how Tusk AI can transform your operational workflows with intelligent
            automation powered by the best AI models.
          </p>
          <a href="#cta" className="px-8 py-3.5 rounded-md text-[10px] tracking-[4px] uppercase font-mono cursor-pointer transition-all duration-300 hover:shadow-[0_0_40px_rgba(109,40,217,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: '1px solid rgba(167,139,250,0.5)',
              color: '#fff',
              boxShadow: '0 0 24px rgba(109,40,217,0.25)',
            }}>
            Initiate a Workflow Audit
          </a>
        </div>
      </div>
    </section>
  )
}
