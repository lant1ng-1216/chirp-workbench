'use client'
import { useEffect, useRef } from 'react'

const MONO = "'Space Mono', monospace"

export default function TransitionBand() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let x = 0
    let raf: number
    const half = track.scrollWidth / 2
    const tick = () => {
      x -= 0.5
      if (Math.abs(x) >= half) x = 0
      track.style.transform = `translateX(${x}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const units = Array.from({ length: 14 })

  return (
    <div style={{
      height: 110,
      background: 'linear-gradient(to bottom, #080810 0%, #080810 50%, #ffffff 100%)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      paddingTop: 24,
    }}>

      <div
        ref={trackRef}
        style={{ display: 'flex', alignItems: 'center', width: 'max-content', flexShrink: 0 }}
      >
        {units.map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 44px', flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.1)',
          }}>
            <img src="/minds-logo.png" alt="Minds" style={{ height: 28, width: 'auto', display: 'block', flexShrink: 0 }} />
            <span style={{
              fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const, whiteSpace: 'nowrap',
              lineHeight: 1.6,
            }}>
              Powered by Minds<br />by Animoca Brands
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
