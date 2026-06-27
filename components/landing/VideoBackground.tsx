'use client'
import { useEffect, useRef } from 'react'

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4'

/* Used inside Hero only — position absolute, fills Hero container */
export default function VideoBackground() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.loop = true
    video.play().catch(() => {})
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: '-5%',
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
      />
    </div>
  )
}
