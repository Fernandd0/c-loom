'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// A workspace is a galaxy and its tasks are planets: the empty-board message is drawn
// with real dots that fly in from a spiral while the camera pulls back, then softly glow.

interface Dot {
  x: number
  y: number
  // Where it starts in the spiral, as distance and angle from the center.
  r: number
  angle: number
  delay: number
  phase: number
}

const COLOR = '#CBD5E1'
const ASSEMBLE_MS = 1800
const MAX_DELAY_MS = 600
const ZOOM_FROM = 3.2
// How far the spiral turns while the planets settle, in radians.
const SPIN = 1.6
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function GalaxyText({
  lines,
  className,
}: {
  lines: string[]
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const text = lines.join('\n')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rows = text.split('\n')
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const fontFamily = getComputedStyle(canvas).fontFamily

    let dots: Dot[] = []
    let width = 0
    let height = 0
    let cx = 0
    let cy = 0
    let radius = 2
    let start = 0
    let frame = 0

    // Rasterizes the text off screen and keeps one dot per grid cell that falls on a letter.
    const layout = (skipIntro: boolean) => {
      width = canvas.clientWidth
      if (!width) return
      const probe = document.createElement('canvas').getContext('2d')!
      let size = Math.min(150, width / 5)
      probe.font = `700 ${size}px ${fontFamily}`
      const widest = Math.max(...rows.map((r) => probe.measureText(r).width))
      size = Math.max(28, size * Math.min(1, (width * 0.92) / widest))
      const step = Math.max(4, Math.round(size / 16))
      const lineHeight = size * 1.05
      // Room above and below so the spiral isn't clipped while it's zoomed in.
      const pad = size * 0.5
      height = Math.ceil(lineHeight * rows.length + pad * 2)
      radius = step * 0.38

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const off = document.createElement('canvas')
      off.width = width
      off.height = height
      const o = off.getContext('2d', { willReadFrequently: true })!
      o.font = `700 ${size}px ${fontFamily}`
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      rows.forEach((row, i) =>
        o.fillText(row, width / 2, pad + lineHeight * (i + 0.5))
      )
      const alpha = o.getImageData(0, 0, width, height).data

      cx = width / 2
      cy = height / 2
      const maxR = Math.hypot(width, height) / 2
      dots = []
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          if (alpha[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] < 128)
            continue
          // Two-armed spiral, flattened like a galaxy seen at an angle.
          const r = Math.random() ** 0.6 * maxR
          const arm = Math.random() < 0.5 ? 0 : Math.PI
          const angle = arm + r * 0.012 + (Math.random() - 0.5) * 0.7
          dots.push({
            x,
            y,
            r,
            angle,
            delay: (r / maxR) * MAX_DELAY_MS,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
      start = performance.now() - (skipIntro ? ASSEMBLE_MS + MAX_DELAY_MS : 0)
    }

    const draw = (now: number) => {
      const elapsed = reduceMotion ? Infinity : now - start
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      // Camera starts close, so the planets read as circles, then pulls back.
      const zoom =
        1 +
        (ZOOM_FROM - 1) *
          (1 - easeOut(Math.min(1, elapsed / (ASSEMBLE_MS + MAX_DELAY_MS))))
      ctx.translate(width / 2, height / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-width / 2, -height / 2)

      ctx.fillStyle = COLOR
      ctx.beginPath()
      for (const d of dots) {
        const t = easeOut(
          Math.min(1, Math.max(0, (elapsed - d.delay) / ASSEMBLE_MS))
        )
        // The spiral keeps turning until each planet has reached its place.
        const a = d.angle + SPIN * (1 - t)
        const fromX = cx + Math.cos(a) * d.r
        const fromY = cy + Math.sin(a) * d.r * 0.45
        const x = fromX + (d.x - fromX) * t
        const y = fromY + (d.y - fromY) * t
        const r = reduceMotion
          ? radius
          : radius * (0.82 + 0.18 * Math.sin(now / 700 + d.phase))
        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.restore()
      if (!reduceMotion) frame = requestAnimationFrame(draw)
    }

    layout(false)
    frame = requestAnimationFrame(draw)

    // Re-flow on resize without replaying the intro.
    let lastWidth = canvas.clientWidth
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === lastWidth) return
      lastWidth = canvas.clientWidth
      layout(true)
      if (reduceMotion) draw(performance.now())
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('block w-full font-sans', className)}
    />
  )
}
