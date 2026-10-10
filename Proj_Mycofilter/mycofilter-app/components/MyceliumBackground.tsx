'use client'

import { useEffect, useRef, useState } from 'react'

interface Point {
  x: number
  y: number
}

interface Hypha {
  points: Point[]
  depth: number
  opacity: number
  phase: number
  speed: number
  cycle: number
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export default function MyceliumBackground({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const hyphaeRef = useRef<Hypha[]>([])
  const rafRef = useRef<number>(0)
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const createHypha = (
      start: Point,
      angle: number,
      length: number,
      depth: number,
      phase: number,
    ): Hypha => {
      const points: Point[] = [start]
      let current = start
      let heading = angle
      const segments = Math.max(6, Math.floor(length / 13))

      for (let i = 0; i < segments; i++) {
        heading += (Math.random() - 0.5) * 0.48
        const step = 9 + Math.random() * 9
        current = {
          x: current.x + Math.cos(heading) * step,
          y: current.y + Math.sin(heading) * step,
        }
        points.push(current)
      }

      return {
        points,
        depth,
        opacity: (0.3 + Math.random() * 0.34) * (1 - depth * 0.1),
        phase: phase + Math.random() * 900,
        speed: 0.00011 + Math.random() * 0.0001,
        cycle: 0.35 + Math.random() * 0.45,
      }
    }

    const initHyphae = () => {
      const W = canvas.width
      const H = canvas.height
      const strands: Hypha[] = []
      const colonyCount = Math.min(42, Math.max(24, Math.floor((W * H) / 48000)))

      for (let colony = 0; colony < colonyCount; colony++) {
        const start = { x: Math.random() * W, y: Math.random() * H }
        const primaryCount = 2 + Math.floor(Math.random() * 2)
        for (let branch = 0; branch < primaryCount; branch++) {
          const primary = createHypha(
            start,
            (Math.PI * 2 * branch) / primaryCount + (Math.random() - 0.5) * 0.7,
            110 + Math.random() * 150,
            0,
            colony * 700 + branch * 110,
          )
          strands.push(primary)

          for (let i = 2; i < primary.points.length - 2; i += 1 + Math.floor(Math.random() * 2)) {
            if (Math.random() > 0.2) continue
            const previous = primary.points[i - 1]
            const tip = primary.points[i]
            const branchAngle = Math.atan2(tip.y - previous.y, tip.x - previous.x)
            const side = Math.random() > 0.5 ? 1 : -1
            const secondary = createHypha(
              tip,
              branchAngle + side * (0.65 + Math.random() * 0.7),
              48 + Math.random() * 82,
              1,
              colony * 500 + i * 60,
            )
            strands.push(secondary)

            if (Math.random() > 0.35) {
              const childTip = secondary.points[Math.min(3, secondary.points.length - 1)]
              const childPrevious = secondary.points[Math.max(0, Math.min(2, secondary.points.length - 2))]
              strands.push(createHypha(
                childTip,
                Math.atan2(childTip.y - childPrevious.y, childTip.x - childPrevious.x) + side * 0.8,
                30 + Math.random() * 52,
                2,
                colony * 300 + i * 33,
              ))
            }
          }
        }
      }

      // A few short fusions reproduce the anastomosing texture of real mycelium.
      for (let i = 0; i < strands.length; i += 3) {
        const source = strands[i].points[strands[i].points.length - 1]
        let nearest: Point | null = null
        let nearestDistance = 110
        for (let j = i + 1; j < strands.length; j++) {
          const candidate = strands[j].points[strands[j].points.length - 1]
          const gap = distance(source, candidate)
          if (gap < nearestDistance) {
            nearest = candidate
            nearestDistance = gap
          }
        }
        if (nearest) {
          strands.push({
            points: [source, { x: (source.x + nearest.x) / 2, y: (source.y + nearest.y) / 2 }, nearest],
            depth: 2,
            opacity: 0.18,
            phase: i * 90,
            speed: 0.00012,
            cycle: 0.7,
          })
        }
      }
      hyphaeRef.current = strands
    }

    const drawHypha = (hypha: Hypha, now: number) => {
      if (hypha.points.length < 2) return
      const cycleProgress = ((now - hypha.phase) * hypha.speed / hypha.cycle) % 1
      const growthWave = cycleProgress < 0.84
        ? cycleProgress / 0.84
        : 1 - (cycleProgress - 0.84) / 0.16
      const growth = 0.22 + Math.max(0, Math.min(1, growthWave)) * 0.78
      const visiblePoints = Math.max(2, Math.floor((hypha.points.length - 1) * growth) + 1)
      const mouse = mouseRef.current
      const tip = hypha.points[visiblePoints - 1]
      let nearestDistance = distance(tip, mouse)
      for (let i = 0; i < visiblePoints; i++) {
        nearestDistance = Math.min(nearestDistance, distance(hypha.points[i], mouse))
      }
      const mouseDistance = nearestDistance
      const focus = mouseDistance < 180 ? 1 - mouseDistance / 180 : 0
      const alpha = Math.min(0.95, (hypha.opacity + focus * 0.5) * intensity)

      ctx.beginPath()
      ctx.moveTo(hypha.points[0].x, hypha.points[0].y)
      for (let i = 1; i < visiblePoints; i++) {
        const previous = hypha.points[i - 1]
        const point = hypha.points[i]
        const midX = (previous.x + point.x) / 2
        const midY = (previous.y + point.y) / 2
        ctx.quadraticCurveTo(previous.x, previous.y, midX, midY)
      }
      const last = hypha.points[visiblePoints - 1]
      ctx.lineTo(last.x, last.y)

      // Fine outer halo and narrow inner wall mimic translucent, tapering hyphae.
      ctx.strokeStyle = `rgba(11,189,182,${alpha * 0.16})`
      ctx.lineWidth = Math.max(1.4, 3.8 - hypha.depth * 0.7)
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.strokeStyle = `rgba(88,153,91,${alpha})`
      ctx.lineWidth = Math.max(0.48, 1.5 - hypha.depth * 0.3)
      ctx.stroke()

      // A short moving highlight travels along the hypha, never as a circular node.
      const shimmer = (now * 0.00006 + hypha.phase * 0.001) % 1
      const shimmerIndex = Math.min(visiblePoints - 1, Math.floor(shimmer * visiblePoints))
      const shimmerPoint = hypha.points[shimmerIndex]
      if (shimmerPoint && hypha.depth < 2) {
        const previous = hypha.points[Math.max(0, shimmerIndex - 1)]
        const direction = Math.atan2(shimmerPoint.y - previous.y, shimmerPoint.x - previous.x)
        const length = 8 - hypha.depth * 2
        ctx.beginPath()
        ctx.moveTo(
          shimmerPoint.x - Math.cos(direction) * length,
          shimmerPoint.y - Math.sin(direction) * length,
        )
        ctx.lineTo(
          shimmerPoint.x + Math.cos(direction) * length,
          shimmerPoint.y + Math.sin(direction) * length,
        )
        ctx.lineCap = 'round'
        ctx.lineWidth = 1.1
        ctx.strokeStyle = `rgba(35,224,207,${alpha * 0.55})`
        ctx.stroke()
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initHyphae()
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const hypha of hyphaeRef.current) drawHypha(hypha, now)
      rafRef.current = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [prefersReduced, intensity])

  if (prefersReduced) return null

  return (
    <canvas
      ref={canvasRef}
      id="mycelium-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: intensity,
      }}
    />
  )
}
