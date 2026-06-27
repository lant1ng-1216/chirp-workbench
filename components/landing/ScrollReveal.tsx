'use client'
import { useEffect, useRef, ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  delay?: number        // ms
  direction?: 'up' | 'left' | 'right' | 'none'
  style?: CSSProperties
}

export default function ScrollReveal({ children, delay = 0, direction = 'up', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const translateMap = { up: 'translateY(28px)', left: 'translateX(-24px)', right: 'translateX(24px)', none: 'none' }

    // Initial hidden state
    el.style.opacity = '0'
    el.style.transform = translateMap[direction]
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, direction])

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  )
}
