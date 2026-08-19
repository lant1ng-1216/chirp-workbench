'use client'
import { useEffect, useRef } from 'react'

const AVATAR_SEEDS = ['chirp', 'minds', 'creator', 'nova', 'byte', 'flux', 'echo', 'zara', 'kibo', 'orbit']

const STYLES = `
@keyframes chirp-card-fall {
  0%   { transform: translateY(-60px) rotate(var(--r0)); opacity: 0; }
  8%   { opacity: var(--op); }
  92%  { opacity: var(--op); }
  100% { transform: translateY(calc(100% + 80px)) rotate(var(--r1)); opacity: 0; }
}
`

/** Soft falling avatars — reused as project-card atmosphere (ex-onboarding). */
export default function CardAtmosphere({ density = 8 }: { density?: number }) {
  const seeds = AVATAR_SEEDS.slice(0, density)
  return (
    <>
      <style>{STYLES}</style>
      {seeds.map((seed, i) => {
        const size = 22 + (i % 4) * 6
        const left = 8 + ((i * 17) % 84)
        const duration = 10 + (i % 5) * 2
        const delay = -(i * 1.4)
        const opacity = 0.1 + (i % 3) * 0.06
        return (
          <img
            key={seed}
            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}`}
            alt=""
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: 0,
              width: size,
              height: size,
              pointerEvents: 'none',
              animation: `chirp-card-fall ${duration}s linear ${delay}s infinite`,
              ['--r0' as string]: `${(i % 5) * 6 - 12}deg`,
              ['--r1' as string]: `${(i % 7) * 5 - 15}deg`,
              ['--op' as string]: opacity,
            }}
          />
        )
      })}
    </>
  )
}

export function StickerCanvasBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const stickers = ['✨', '🎬', '📸', '🎵', '🔁', '🚀', '🎯', '⚡']
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    type P = { x: number; y: number; size: number; speed: number; opacity: number; emoji: string }
    const particles: P[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * (canvas.width || 400),
      y: Math.random() * (canvas.height || 300),
      size: 12 + Math.random() * 14,
      speed: 0.25 + Math.random() * 0.45,
      opacity: 0.06 + Math.random() * 0.12,
      emoji: stickers[Math.floor(Math.random() * stickers.length)],
    }))
    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.y += p.speed
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width }
        ctx.globalAlpha = p.opacity
        ctx.font = `${p.size}px sans-serif`
        ctx.fillText(p.emoji, p.x, p.y)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
