'use client'

import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  analyser: AnalyserNode | null
  isActive: boolean
  color?: string
  height?: number
}

export function AudioVisualizer({
  analyser,
  isActive,
  color = 'var(--neon-cyan)',
  height = 48,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser || !isActive) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const { width, height: h } = canvas
      ctx.clearRect(0, 0, width, h)

      const barCount = 32
      const barWidth = width / barCount - 2
      const step = Math.floor(bufferLength / barCount)

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255
        const barHeight = Math.max(2, value * h * 0.9)

        const x = i * (barWidth + 2) + 1
        const y = (h - barHeight) / 2

        // Glow effect
        ctx.shadowBlur = value * 12
        ctx.shadowColor = color
        ctx.fillStyle = color
        ctx.globalAlpha = 0.3 + value * 0.7
        ctx.fillRect(x, y, barWidth, barHeight)
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [analyser, isActive, color])

  // Idle state — static bars
  if (!isActive) {
    return (
      <div
        className="flex items-center justify-center gap-[3px]"
        style={{ height }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/10"
            style={{
              width: 4,
              height: 2,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={height}
      className="w-full"
      style={{ height }}
    />
  )
}
