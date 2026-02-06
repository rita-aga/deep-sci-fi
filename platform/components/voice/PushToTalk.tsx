'use client'

import { useCallback, useEffect, useRef } from 'react'
import { AudioVisualizer } from './AudioVisualizer'

type PTTStatus = 'idle' | 'recording' | 'processing' | 'speaking'

interface PushToTalkProps {
  status: PTTStatus
  analyserNode: AnalyserNode | null
  onStartRecording: () => void
  onStopRecording: () => void
  disabled?: boolean
}

const STATUS_CONFIG: Record<
  PTTStatus,
  { label: string; color: string; glowColor: string; pulse: boolean }
> = {
  idle: {
    label: 'HOLD TO SPEAK',
    color: 'var(--neon-cyan)',
    glowColor: 'var(--shadow-cyan-soft)',
    pulse: true,
  },
  recording: {
    label: 'LISTENING...',
    color: 'var(--neon-cyan)',
    glowColor: 'var(--shadow-cyan)',
    pulse: false,
  },
  processing: {
    label: 'PROCESSING...',
    color: 'var(--neon-purple)',
    glowColor: 'var(--shadow-purple)',
    pulse: true,
  },
  speaking: {
    label: 'SPEAKING...',
    color: 'var(--neon-purple)',
    glowColor: 'var(--shadow-purple-soft)',
    pulse: false,
  },
}

export function PushToTalk({
  status,
  analyserNode,
  onStartRecording,
  onStopRecording,
  disabled = false,
}: PushToTalkProps) {
  const isHoldingRef = useRef(false)
  const config = STATUS_CONFIG[status]
  const canRecord = status === 'idle' && !disabled

  const handlePointerDown = useCallback(() => {
    if (!canRecord) return
    isHoldingRef.current = true
    onStartRecording()
  }, [canRecord, onStartRecording])

  const handlePointerUp = useCallback(() => {
    if (!isHoldingRef.current) return
    isHoldingRef.current = false
    onStopRecording()
  }, [onStopRecording])

  // Space bar shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code !== 'Space' ||
        e.repeat ||
        !canRecord ||
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      )
        return
      e.preventDefault()
      isHoldingRef.current = true
      onStartRecording()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !isHoldingRef.current) return
      e.preventDefault()
      isHoldingRef.current = false
      onStopRecording()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [canRecord, onStartRecording, onStopRecording])

  // Safety: release on pointer leave
  useEffect(() => {
    const handlePointerCancel = () => {
      if (isHoldingRef.current) {
        isHoldingRef.current = false
        onStopRecording()
      }
    }
    window.addEventListener('pointerup', handlePointerCancel)
    window.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      window.removeEventListener('pointerup', handlePointerCancel)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [onStopRecording])

  return (
    <div className="flex flex-col items-center gap-4 py-4 px-6">
      {/* Audio visualizer */}
      <AudioVisualizer
        analyser={analyserNode}
        isActive={status === 'recording'}
        color={config.color}
        height={48}
      />

      {/* Push-to-talk button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        disabled={!canRecord && status !== 'recording'}
        className="relative select-none touch-none"
        style={{ WebkitTouchCallout: 'none' }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 -m-1 transition-all duration-300"
          style={{
            boxShadow: `0 0 ${status === 'recording' ? '24px' : '12px'} ${config.glowColor}`,
            border: `1px solid ${config.color}`,
            opacity: status === 'idle' ? 0.5 : 1,
            animation:
              config.pulse
                ? 'voice-pulse 2s ease-in-out infinite'
                : undefined,
          }}
        />

        {/* Button face */}
        <div
          className="relative flex items-center justify-center gap-2 px-8 py-3 transition-all duration-200"
          style={{
            backgroundColor:
              status === 'recording'
                ? `color-mix(in srgb, ${config.color} 15%, transparent)`
                : 'transparent',
            border: `1px solid color-mix(in srgb, ${config.color} 40%, transparent)`,
          }}
        >
          {/* Mic icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="square"
          >
            <rect x="9" y="1" width="6" height="14" rx="0" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>

          <span
            className="text-[11px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
      </button>

      {/* Keyboard hint */}
      {status === 'idle' && (
        <span className="text-[10px] text-[var(--text-muted)] tracking-wider">
          or hold <kbd className="px-1 py-0.5 border border-white/10 text-[var(--text-tertiary)]">Space</kbd>
        </span>
      )}
    </div>
  )
}
