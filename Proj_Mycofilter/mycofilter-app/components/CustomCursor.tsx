'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef  = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafRef  = useRef<number>(0)
  const [hidden, setHidden] = useState(true)
  const [isPointer, setIsPointer] = useState(false)

  useEffect(() => {
    // Only on pointer devices + no reduced-motion
    const mq = window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)')
    if (mq.matches) return

    setHidden(false)

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cursorStyle = el ? window.getComputedStyle(el).cursor : 'auto'
      setIsPointer(cursorStyle === 'pointer')
    }

    const animate = () => {
      const { x, y } = posRef.current
      const ring = ringPos.current
      // Ring follows with spring-like lag
      ring.x += (x - ring.x) * 0.12
      ring.y += (y - ring.y) * 0.12
      ringPos.current = ring

      if (dotRef.current) {
        dotRef.current.style.left  = `${x}px`
        dotRef.current.style.top   = `${y}px`
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.x}px`
        ringRef.current.style.top  = `${ring.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (hidden) return null

  return (
    <>
      <div
        ref={dotRef}
        id="custom-cursor"
        aria-hidden="true"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          width: isPointer ? 16 : 10,
          height: isPointer ? 16 : 10,
          background: isPointer ? '#0bbdb6' : '#3d7d3f',
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          transition: 'width 0.2s, height 0.2s, background 0.2s',
          mixBlendMode: 'multiply',
        }}
      />
      <div
        ref={ringRef}
        id="custom-cursor-ring"
        aria-hidden="true"
        className={isPointer ? 'hovering' : ''}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9998,
          width: isPointer ? 52 : 36,
          height: isPointer ? 52 : 36,
          border: `1.5px solid ${isPointer ? '#0bbdb6' : 'rgba(61,125,63,0.5)'}`,
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          transition: 'width 0.2s, height 0.2s, border-color 0.2s',
        }}
      />
    </>
  )
}
