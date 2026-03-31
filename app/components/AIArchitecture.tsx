'use client'

import { useRef, useEffect, useState } from 'react'

const SECTIONS = [
  {
    title: "We absorb your operational chaos and make it ",
    highlight: "disappear.",
    description: "Emails, documents, spreadsheets, task queues — every scattered data source feeds into Tusk AI's ingestion layer. No manual sorting. No missed inputs. Just seamless absorption.",
    bullets: [
      'Launch automations in days instead of months',
      'Reduce team workload and staffing requirements',
      'Eliminate manual data entry and routing',
    ],
    accent: '#a78bfa',
    side: 'left' as const,
  },
  {
    title: "Gemini interprets the ",
    highlight: "big picture.",
    description: "Google's Gemini engine processes large-context data — connecting dots across hundreds of documents, recognizing patterns humans would miss, and building a complete operational map.",
    bullets: [
      'Complex document analysis at scale',
      'Multi-source correlation and insight',
      'Pattern recognition across datasets',
    ],
    accent: '#4285f4',
    side: 'right' as const,
  },
  {
    title: "OpenAI orchestrates ",
    highlight: "the logic.",
    description: "The reasoning layer builds decision trees, routes tasks intelligently, and structures outputs — turning raw analysis into executable plans your team can act on immediately.",
    bullets: [
      'Decision tree generation',
      'Logic-based task routing',
      'Structured output formatting',
    ],
    accent: '#10a37f',
    side: 'left' as const,
  },
  {
    title: "You get clarity, not ",
    highlight: "noise.",
    description: "Auto-generated reports, triggered workflow actions, and AI-drafted documents — delivered exactly where you need them, when you need them. From chaos to clarity, automatically.",
    bullets: [
      'Auto-generated reports & dashboards',
      'Triggered workflow actions',
      'AI-drafted operational documents',
    ],
    accent: '#c084fc',
    side: 'right' as const,
  },
]

function ContentBlock({ section, visible }: { section: typeof SECTIONS[0]; visible: boolean }) {
  const isLeft = section.side === 'left'

  return (
    <div style={{
      width: '100%',
      padding: isLeft ? '0 18vw 0 7vw' : '0 7vw 0 18vw',
      textAlign: isLeft ? 'left' : 'right',
    }}>

      {/* Label row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '28px',
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s',
      }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: section.accent,
          boxShadow: `0 0 16px ${section.accent}`,
          order: isLeft ? 0 : 2,
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: '10px',
          letterSpacing: '6px', textTransform: 'uppercase',
          color: `${section.accent}99`,
        }}>
          {isLeft ? 'Input Layer' : 'AI Engine'}
        </span>
        <div style={{
          flex: 1, maxWidth: '60px', height: '1px',
          background: `${section.accent}30`,
          order: isLeft ? 2 : 0,
        }} />
      </div>

      {/* Big heading — largest element */}
      <h3 style={{
        fontWeight: 800,
        lineHeight: 1.08,
        marginBottom: '36px',
        fontSize: 'clamp(38px, 5.5vw, 72px)',
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: '-1px',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(0) translateY(0)'
          : `translateX(${isLeft ? '-50px' : '50px'}) translateY(20px)`,
        transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.08s',
      }}>
        {section.title}
        <span style={{ color: section.accent }}>{section.highlight}</span>
      </h3>

      {/* Description — bigger and more readable */}
      <p style={{
        color: 'rgba(255,255,255,0.45)',
        fontSize: 'clamp(16px, 1.3vw, 20px)',
        lineHeight: 1.9,
        marginBottom: '36px',
        maxWidth: '600px',
        marginLeft: isLeft ? 0 : 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.18s',
      }}>
        {section.description}
      </p>

      {/* "This allows" label */}
      <p style={{
        color: 'rgba(255,255,255,0.3)',
        fontSize: '13px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '18px',
        opacity: visible ? 1 : 0,
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.28s',
      }}>
        This allows companies to:
      </p>

      {/* Bullets */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {section.bullets.map((b, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexDirection: isLeft ? 'row' : 'row-reverse',
            justifyContent: isLeft ? 'flex-start' : 'flex-end',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : `translateX(${isLeft ? '-40px' : '40px'})`,
            transition: `all 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${0.35 + i * 0.1}s`,
          }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: section.accent,
              opacity: 0.6,
              flexShrink: 0,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 1.1vw, 17px)' }}>
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AIArchitecture() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set())
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-step'))
          if (entry.isIntersecting) {
            setVisibleSteps((prev) => new Set(prev).add(idx))
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    )
    stepRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="architecture"
      ref={sectionRef}
      style={{ background: '#020008', width: '100%', overflow: 'hidden' }}
    >
      {/* Centered header */}
      <div style={{ textAlign: 'center', padding: '120px 48px 130px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '1px', background: 'rgba(167,139,250,0.4)' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '6px', textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)' }}>
            AI Architecture
          </span>
          <div style={{ width: '32px', height: '1px', background: 'rgba(167,139,250,0.4)' }} />
        </div>

        <h2 style={{ fontSize: 'clamp(30px, 4.2vw, 56px)', fontWeight: 700, color: '#ede9fe', marginBottom: '24px', lineHeight: 1.15 }}>
          How Tusk AI{' '}
          <span style={{ background: 'linear-gradient(95deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Processes Data
          </span>
        </h2>

        <p style={{ color: 'rgba(196,181,253,0.4)', fontSize: '16px', lineHeight: 1.85 }}>
          Data flows through two specialized AI engines — each handling different
          aspects of your operations — and produces structured, actionable outputs.
        </p>
      </div>

      {/* Full-width content blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '160px', paddingBottom: '160px' }}>
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            ref={(el) => { stepRefs.current[i] = el }}
            data-step={i}
          >
            <ContentBlock section={section} visible={visibleSteps.has(i)} />
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 48px 140px' }}>
        <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to bottom, rgba(167,139,250,0.3), transparent)', marginBottom: '40px' }} />
        <p style={{ color: 'rgba(196,181,253,0.35)', fontSize: '15px', maxWidth: '480px', lineHeight: 1.85, marginBottom: '36px' }}>
          See how Tusk AI can transform your operational workflows with intelligent
          automation powered by the best AI models.
        </p>
        <a href="#cta" style={{
          padding: '14px 36px', borderRadius: '6px', fontSize: '10px',
          letterSpacing: '4px', textTransform: 'uppercase', fontFamily: 'monospace',
          cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          border: '1px solid rgba(167,139,250,0.5)', color: '#fff',
          boxShadow: '0 0 24px rgba(109,40,217,0.25)', textDecoration: 'none',
        }}>
          Initiate a Workflow Audit
        </a>
      </div>
    </section>
  )
}
