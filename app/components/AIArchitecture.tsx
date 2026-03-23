'use client'

import { useRef, useEffect, useState } from 'react'

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

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

export default function AIArchitecture() {
  const { ref: sectionRef, visible } = useScrollReveal(0.2)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!visible) return
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1500),
      setTimeout(() => setStep(4), 2200),
      setTimeout(() => setStep(5), 3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [visible])

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative min-h-screen pb-32 overflow-hidden"
      style={{ background: '#020008', width: '100%', maxWidth: '100vw' }}
    >
      <div style={{ height: '200px' }} />

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(167,139,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Section header */}
      <div className="relative z-10 mb-16 px-6" style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
        opacity: step >= 1 ? 1 : 0,
        transform: step >= 1 ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px" style={{ background: 'rgba(167,139,250,0.4)' }} />
          <span className="font-mono text-[9px] tracking-[6px] uppercase" style={{ color: 'rgba(167,139,250,0.5)' }}>
            AI Architecture
          </span>
          <div className="w-8 h-px" style={{ background: 'rgba(167,139,250,0.4)' }} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ede9fe' }}>
          How Tusk AI{' '}
          <span style={{ background: 'linear-gradient(95deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Processes Data
          </span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto leading-7" style={{ color: 'rgba(196,181,253,0.4)' }}>
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
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="engineGlow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="100%" stopColor="#1a73e8" />
            </linearGradient>
            <linearGradient id="openaiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10a37f" />
              <stop offset="100%" stopColor="#0d8c6d" />
            </linearGradient>
            <linearGradient id="outputGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* ── LEFT COLUMN: INPUT DATA SOURCES ── */}
          {/* Column center: x=160, boxes: 80–240 */}
          <g style={{ opacity: step >= 2 ? 1 : 0, transition: 'opacity 0.8s ease 0.1s' }}>
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

          {/* ── INPUT → ENGINE STREAM LINES ── */}
          <g style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}>
            <path d="M240,86 C310,86 340,170 380,170" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M240,158 C310,158 340,170 380,170" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M240,278 C310,278 340,310 380,310" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M240,350 C310,350 340,310 380,310" stroke="url(#streamGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />

            <DataParticle path="M240,86 C310,86 340,170 380,170" duration={2.5} delay={0} color="#a78bfa" size={3} />
            <DataParticle path="M240,86 C310,86 340,170 380,170" duration={2.5} delay={1.2} color="#c084fc" size={2.5} />
            <DataParticle path="M240,158 C310,158 340,170 380,170" duration={2.8} delay={0.4} color="#818cf8" size={3} />
            <DataParticle path="M240,278 C310,278 340,310 380,310" duration={2.6} delay={0.8} color="#a78bfa" size={3} />
            <DataParticle path="M240,350 C310,350 340,310 380,310" duration={2.4} delay={0.2} color="#c084fc" size={2.5} />
          </g>

          {/* ── CENTER COLUMN: ENGINE 1 – GEMINI ── */}
          {/* Column center: x=500, boxes: 380–620 */}
          <g style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'scale(1)' : 'scale(0.9)', transformOrigin: '500px 170px', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}>
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

          {/* ── CENTER COLUMN: ENGINE 2 – OPENAI ── */}
          <g style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'scale(1)' : 'scale(0.9)', transformOrigin: '500px 310px', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s' }}>
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

          {/* ── ENGINE → OUTPUT STREAM LINES ── */}
          <g style={{ opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
            <path d="M620,170 C680,170 700,130 760,130" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M620,170 C680,170 700,240 760,240" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M620,330 C680,330 700,240 760,240" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
            <path d="M620,330 C680,330 700,350 760,350" stroke="url(#outputGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />

            <DataParticle path="M620,170 C680,170 700,130 760,130" duration={2.2} delay={0.3} color="#c084fc" size={3} />
            <DataParticle path="M620,170 C680,170 700,240 760,240" duration={2.4} delay={0.7} color="#a78bfa" size={3} />
            <DataParticle path="M620,330 C680,330 700,240 760,240" duration={2.6} delay={0.1} color="#10a37f" size={3} />
            <DataParticle path="M620,330 C680,330 700,350 760,350" duration={2.3} delay={0.5} color="#818cf8" size={2.5} />
          </g>

          {/* ── RIGHT COLUMN: STRUCTURED OUTPUTS ── */}
          {/* Column center: x=840, boxes: 760–920 */}
          <g style={{ opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}>
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
        marginTop: '80px',
        opacity: step >= 5 ? 1 : 0,
        transform: step >= 5 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
      }}>
        <p className="text-sm max-w-lg text-center mb-8" style={{ color: 'rgba(196,181,253,0.35)' }}>
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
    </section>
  )
}
