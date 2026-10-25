'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// A workspace is a galaxy and its tasks are planets: text is drawn with real dots that
// fly in from a spiral spanning the whole page while the camera pulls back, then glow.
// The box keeps the text's place in the layout; the dots live on a full-screen canvas
// so nothing clips them. Their color is the box's CSS `color`, so themes apply.

interface Dot {
  // Target, relative to the box.
  x: number
  y: number
  // Start in the spiral, as distance and angle from the text's center.
  r: number
  angle: number
  delay: number
  phase: number
}

const ASSEMBLE_MS = 1800
const MAX_DELAY_MS = 600
const ZOOM_FROM = 3.2
// How far the spiral turns while the planets settle, in radians.
const SPIN = 1.6
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function GalaxyText({
  lines,
  maxFontSize = 150,
  className,
}: {
  lines: string[]
  maxFontSize?: number
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const text = lines.join('\n')

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!box || !canvas || !ctx) return
    const rows = text.split('\n')
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const fontFamily = getComputedStyle(box).fontFamily

    let dots: Dot[] = []
    let radius = 2
    let start = 0
    let frame = 0

    const sizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Rasterizes the text off screen and keeps one dot per grid cell that falls on a letter.
    const layout = (skipIntro: boolean) => {
      const width = box.clientWidth
      if (!width) return
      const probe = document.createElement('canvas').getContext('2d')!
      let size = Math.min(maxFontSize, width / 5)
      probe.font = `700 ${size}px ${fontFamily}`
      const widest = Math.max(...rows.map((r) => probe.measureText(r).width))
      size = Math.max(28, size * Math.min(1, (width * 0.92) / widest))
      const step = Math.max(4, Math.round(size / 16))
      const lineHeight = size * 1.05
      const height = Math.ceil(lineHeight * rows.length + step * 2)
      box.style.height = `${height}px`
      radius = step * 0.38

      const off = document.createElement('canvas')
      off.width = width
      off.height = height
      const o = off.getContext('2d', { willReadFrequently: true })!
      o.font = `700 ${size}px ${fontFamily}`
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      rows.forEach((row, i) =>
        o.fillText(row, width / 2, step + lineHeight * (i + 0.5))
      )
      const alpha = o.getImageData(0, 0, width, height).data

      // The spiral spans the page, not just the text.
      const maxR = Math.hypot(window.innerWidth, window.innerHeight) / 2
      dots = []
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          if (alpha[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] < 128)
            continue
          // Two-armed spiral, flattened like a galaxy seen at an angle.
          const r = Math.random() ** 0.6 * maxR
          const arm = Math.random() < 0.5 ? 0 : Math.PI
          dots.push({
            x,
            y,
            r,
            angle: arm + r * 0.008 + (Math.random() - 0.5) * 0.7,
            delay: (r / maxR) * MAX_DELAY_MS,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
      start = performance.now() - (skipIntro ? ASSEMBLE_MS + MAX_DELAY_MS : 0)
    }

    const draw = (now: number) => {
      const elapsed = reduceMotion ? Infinity : now - start
      // Read each frame: the box can move (entry animations) and the theme can change.
      const rect = box.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.save()
      // Camera starts close, so the planets read as circles, then pulls back.
      const zoom =
        1 +
        (ZOOM_FROM - 1) *
          (1 - easeOut(Math.min(1, elapsed / (ASSEMBLE_MS + MAX_DELAY_MS))))
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      ctx.fillStyle = getComputedStyle(box).color
      ctx.beginPath()
      for (const d of dots) {
        const t = easeOut(
          Math.min(1, Math.max(0, (elapsed - d.delay) / ASSEMBLE_MS))
        )
        // The spiral keeps turning until each planet has reached its place.
        const a = d.angle + SPIN * (1 - t)
        const fromX = cx + Math.cos(a) * d.r
        const fromY = cy + Math.sin(a) * d.r * 0.45
        const x = fromX + (rect.left + d.x - fromX) * t
        const y = fromY + (rect.top + d.y - fromY) * t
        const r = reduceMotion
          ? radius
          : radius * (0.82 + 0.18 * Math.sin(now / 700 + d.phase))
        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.restore()
      frame = requestAnimationFrame(draw)
    }

    sizeCanvas()
    layout(false)
    frame = requestAnimationFrame(draw)

    // Re-flow on resize without replaying the intro.
    const onResize = () => {
      sizeCanvas()
      layout(true)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [text, maxFontSize])

  return (
    <div
      ref={boxRef}
      aria-hidden
      className={cn('relative w-full font-sans', className)}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 h-screen w-screen"
      />
    </div>
  )
}
