'use client'

const UNIT = (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
    <img src="/minds-logo.png" alt="Minds" style={{ height: 20, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.18em',
      color: 'rgba(255,255,255,0.55)',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap',
    }}>
      Powered by Minds by Animoca Brands
    </span>
    <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.25)', flexShrink: 0, margin: '0 10px' }} />
  </span>
)

export default function MarqueeBand() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #3d5af1 0%, #5b6ef5 40%, #4a5de8 70%, #3d5af1 100%)',
      height: 48,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          animation: marquee-scroll 28s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="marquee-track">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i}>{UNIT}</span>
        ))}
      </div>
    </div>
  )
}
